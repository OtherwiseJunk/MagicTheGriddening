import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/submitAnswer/route";
import { Game } from "@/models/database/game";
import { ConstraintType } from "@/models/UI/gameConstraint";

const mockConstraints = JSON.stringify([
  { displayName: "Red", constraintType: ConstraintType.Color, scryfallQuery: "c:R" },
  { displayName: "Power 1", constraintType: ConstraintType.Power, scryfallQuery: "pow:1" },
  { displayName: "Soldier", constraintType: ConstraintType.Type, scryfallQuery: "t:soldier" },
  { displayName: "Bird", constraintType: ConstraintType.Type, scryfallQuery: "t:bird" },
  { displayName: "Green", constraintType: ConstraintType.Color, scryfallQuery: "c:G" },
  { displayName: "Toughness 6", constraintType: ConstraintType.Toughness, scryfallQuery: "tou:6" },
]);

const mockGame = new Game(1, "20260305", mockConstraints);

const mockPlayer = { id: 1, playerId: "test-uuid", gameId: 1, lifePoints: 9 };

vi.mock("@/services/data.service", () => ({
  default: {
    getTodaysGame: vi.fn(),
    getPlayerRecord: vi.fn(),
    updatePlayerLifeValue: vi.fn(),
    getCorrectGuessesForPlayer: vi.fn(),
    createCorrectGuess: vi.fn(),
  },
}));

vi.mock("@/services/scryfall.service", () => ({
  default: {
    getCards: vi.fn(),
  },
}));

import DataService from "@/services/data.service";
import ScryfallService from "@/services/scryfall.service";

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/submitAnswer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/submitAnswer", () => {
  it("returns 404 when no game exists", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(undefined);

    const response = await POST(makeRequest({ playerId: "test", squareIndex: 0, guess: "Lightning Bolt" }));

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Game Not Found");
  });

  it("returns 422 and deducts life for incorrect guess", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(ScryfallService.getCards).mockResolvedValue([]);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Nonexistent Card" }));

    expect(response.status).toBe(422);
    expect(DataService.updatePlayerLifeValue).toHaveBeenCalledWith(1, 8);
  });

  it("returns 200 for correct guess", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(ScryfallService.getCards).mockResolvedValue([
      { name: "Lightning Bolt", image_uris: { png: "http://example.com/bolt.png" } } as any,
    ]);
    vi.mocked(DataService.getCorrectGuessesForPlayer).mockResolvedValue([]);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Lightning Bolt" }));

    expect(response.status).toBe(200);
    expect(DataService.createCorrectGuess).toHaveBeenCalledWith(
      1, 1, 0, "Lightning Bolt", "http://example.com/bolt.png",
    );
    expect(DataService.updatePlayerLifeValue).toHaveBeenCalledWith(1, 8);
  });

  it("returns 409 for duplicate card without deducting life", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(ScryfallService.getCards).mockResolvedValue([
      { name: "Lightning Bolt", image_uris: { png: "http://example.com/bolt.png" } } as any,
    ]);
    vi.mocked(DataService.getCorrectGuessesForPlayer).mockResolvedValue([
      { correctGuess: "Lightning Bolt" },
    ]);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 1, guess: "Lightning Bolt" }));

    expect(response.status).toBe(409);
    expect(DataService.updatePlayerLifeValue).not.toHaveBeenCalled();
    expect(DataService.createCorrectGuess).not.toHaveBeenCalled();
  });

  it("falls back to card_faces for double-faced cards", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(ScryfallService.getCards).mockResolvedValue([
      {
        name: "Delver of Secrets",
        image_uris: undefined,
        card_faces: [{ image_uris: { png: "http://example.com/delver.png" } }],
      } as any,
    ]);
    vi.mocked(DataService.getCorrectGuessesForPlayer).mockResolvedValue([]);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Delver of Secrets" }));

    expect(response.status).toBe(200);
    expect(DataService.createCorrectGuess).toHaveBeenCalledWith(
      1, 1, 0, "Delver of Secrets", "http://example.com/delver.png",
    );
  });

  it("uses fallback image when no image_uris or card_faces", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(ScryfallService.getCards).mockResolvedValue([
      { name: "Weird Card", image_uris: undefined, card_faces: undefined } as any,
    ]);
    vi.mocked(DataService.getCorrectGuessesForPlayer).mockResolvedValue([]);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Weird Card" }));

    expect(response.status).toBe(200);
    expect(DataService.createCorrectGuess).toHaveBeenCalledWith(
      1, 1, 0, "Weird Card", "./card-not-found.png",
    );
  });

  it("returns 500 when an unexpected error occurs", async () => {
    vi.mocked(DataService.getTodaysGame).mockRejectedValue(new Error("DB connection failed"));

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Lightning Bolt" }));

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Internal Server Error");
  });
});

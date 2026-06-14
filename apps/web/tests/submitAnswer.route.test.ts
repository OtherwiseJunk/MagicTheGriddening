// tests/submitAnswer.route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/submitAnswer/route";
import { Game } from "@/models/database/game";
import { ConstraintType } from "@/models/UI/gameConstraint";
import { type LocalCard } from "@/models/local-card";

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

function makeMockCard(overrides: Partial<LocalCard> = {}): LocalCard {
  return {
    name: "Lightning Bolt",
    faceNames: [],
    type_line: "Instant",
    colors: ["R"],
    cmc: 1,
    rarities: ["common"],
    oracle_text: "Lightning Bolt deals 3 damage to any target.",
    power: undefined,
    toughness: undefined,
    artists: ["Christopher Moeller"],
    sets: ["lea"],
    imagePng: "http://example.com/bolt.png",
    ...overrides,
  };
}

vi.mock("@/services/data.service", () => ({
  default: {
    getTodaysGame: vi.fn(),
    getPlayerRecord: vi.fn(),
    updatePlayerLifeValue: vi.fn(),
    getCorrectGuessesForPlayer: vi.fn(),
    createCorrectGuess: vi.fn(),
  },
}));

vi.mock("@/services/card-validation.service", () => ({
  default: {
    findCard: vi.fn(),
    matchesAllConstraints: vi.fn(),
  },
}));

import DataService from "@/services/data.service";
import CardValidationService from "@/services/card-validation.service";

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

  it("returns 422 and deducts life when card not found locally", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(CardValidationService.findCard).mockResolvedValue(undefined);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Nonexistent Card" }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ outcome: "incorrect", lifePoints: 8 });
    expect(DataService.updatePlayerLifeValue).toHaveBeenCalledWith(1, 8);
    expect(CardValidationService.matchesAllConstraints).not.toHaveBeenCalled();
  });

  it("returns 422 and deducts life when card found but fails constraints", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(CardValidationService.findCard).mockResolvedValue(makeMockCard());
    vi.mocked(CardValidationService.matchesAllConstraints).mockReturnValue(false);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Lightning Bolt" }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ outcome: "incorrect", lifePoints: 8 });
  });

  it("returns 200 for correct guess", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(CardValidationService.findCard).mockResolvedValue(makeMockCard());
    vi.mocked(CardValidationService.matchesAllConstraints).mockReturnValue(true);
    vi.mocked(DataService.getCorrectGuessesForPlayer).mockResolvedValue([]);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Lightning Bolt" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      outcome: "correct",
      lifePoints: 8,
      correctGuess: {
        cardName: "Lightning Bolt",
        imageUrl: "http://example.com/bolt.png",
        squareIndex: 0,
      },
    });
    expect(DataService.createCorrectGuess).toHaveBeenCalledWith(
      1, 1, 0, "Lightning Bolt", "http://example.com/bolt.png",
    );
    expect(DataService.updatePlayerLifeValue).toHaveBeenCalledWith(1, 8);
  });

  it("returns 409 for duplicate card without deducting life", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(CardValidationService.findCard).mockResolvedValue(makeMockCard());
    vi.mocked(CardValidationService.matchesAllConstraints).mockReturnValue(true);
    vi.mocked(DataService.getCorrectGuessesForPlayer).mockResolvedValue([
      { correctGuess: "Lightning Bolt" },
    ]);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 1, guess: "Lightning Bolt" }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ outcome: "duplicate" });
    expect(DataService.updatePlayerLifeValue).not.toHaveBeenCalled();
    expect(DataService.createCorrectGuess).not.toHaveBeenCalled();
  });

  it("uses imagePng from LocalCard for double-faced cards", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerRecord).mockResolvedValue(mockPlayer);
    vi.mocked(CardValidationService.findCard).mockResolvedValue(
      makeMockCard({
        name: "Delver of Secrets // Insectile Aberration",
        faceNames: ["Delver of Secrets", "Insectile Aberration"],
        imagePng: "http://example.com/delver.png",
      }),
    );
    vi.mocked(CardValidationService.matchesAllConstraints).mockReturnValue(true);
    vi.mocked(DataService.getCorrectGuessesForPlayer).mockResolvedValue([]);

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Delver of Secrets" }));

    expect(response.status).toBe(200);
    expect(DataService.createCorrectGuess).toHaveBeenCalledWith(
      1, 1, 0, "Delver of Secrets // Insectile Aberration", "http://example.com/delver.png",
    );
  });

  it("returns 500 when an unexpected error occurs", async () => {
    vi.mocked(DataService.getTodaysGame).mockRejectedValue(new Error("DB connection failed"));

    const response = await POST(makeRequest({ playerId: "test-uuid", squareIndex: 0, guess: "Lightning Bolt" }));

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Internal Server Error");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/gameState/[playerId]/route";
import { Game } from "@/models/database/game";
import { ConstraintType } from "@/models/UI/gameConstraint";
import { CorrectGuess } from "@/models/UI/correctGuess";

const mockConstraints = JSON.stringify([
  { displayName: "Red", constraintType: ConstraintType.Color, scryfallQuery: "c:R" },
  { displayName: "Power 1", constraintType: ConstraintType.Power, scryfallQuery: "pow:1" },
  { displayName: "Soldier", constraintType: ConstraintType.Type, scryfallQuery: "t:soldier" },
  { displayName: "Bird", constraintType: ConstraintType.Type, scryfallQuery: "t:bird" },
  { displayName: "Green", constraintType: ConstraintType.Color, scryfallQuery: "c:G" },
  { displayName: "Toughness 6", constraintType: ConstraintType.Toughness, scryfallQuery: "tou:6" },
]);

const mockGame = new Game(1, "20260305", mockConstraints);

vi.mock("@/services/data.service", () => ({
  default: {
    getTodaysGame: vi.fn(),
    getPlayerGameData: vi.fn(),
  },
}));

import DataService from "@/services/data.service";

function makeRequest(playerId: string): [Request, { params: { playerId: string } }] {
  return [
    new Request(`http://localhost/api/gameState/${playerId}`),
    { params: { playerId } },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/gameState/[playerId]", () => {
  it("returns game state for existing player", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerGameData).mockResolvedValue([
      9,
      [new CorrectGuess("Lightning Bolt", "http://example.com/bolt.png", 0)],
    ]);

    const response = await GET(...makeRequest("test-uuid"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.lifePoints).toBe(9);
    expect(body.correctGuesses).toHaveLength(1);
    expect(body.gameConstraints).toHaveLength(6);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns game state with 9 life for new player", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(mockGame);
    vi.mocked(DataService.getPlayerGameData).mockResolvedValue([-1, []]);

    const response = await GET(...makeRequest("new-uuid"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.lifePoints).toBe(9);
    expect(body.correctGuesses).toHaveLength(0);
  });

  it("returns 404 when no game exists", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(undefined);
    vi.mocked(DataService.getPlayerGameData).mockResolvedValue([-1, []]);

    const response = await GET(...makeRequest("test-uuid"));

    expect(response.status).toBe(404);
  });

  it("returns 500 when an unexpected error occurs", async () => {
    vi.mocked(DataService.getTodaysGame).mockRejectedValue(new Error("DB down"));

    const response = await GET(...makeRequest("test-uuid"));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal Server Error");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/stats/[playerId]/route";

vi.mock("@/services/data.service", () => ({
  default: {
    getPlayerStats: vi.fn(),
  },
}));

import DataService from "@/services/data.service";

beforeEach(() => {
  vi.clearAllMocks();
});

const mockStats = {
  gamesPlayed: 10,
  gamesCompleted: 3,
  currentStreak: 2,
  bestStreak: 5,
  scoreDistribution: [0, 0, 0, 1, 2, 3, 2, 1, 1, 0],
};

function makeRequest(playerId: string): [Request, { params: Promise<{ playerId: string }> }] {
  return [
    new Request(`http://localhost/api/stats/${playerId}`),
    { params: Promise.resolve({ playerId }) },
  ];
}

describe("GET /api/stats/[playerId]", () => {
  it("returns stats for a valid player", async () => {
    vi.mocked(DataService.getPlayerStats).mockResolvedValue(mockStats);

    const response = await GET(...makeRequest("test-uuid"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.gamesPlayed).toBe(10);
    expect(body.currentStreak).toBe(2);
    expect(body.scoreDistribution).toHaveLength(10);
    expect(DataService.getPlayerStats).toHaveBeenCalledWith("test-uuid");
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(DataService.getPlayerStats).mockRejectedValue(new Error("DB down"));
    const response = await GET(...makeRequest("test-uuid"));
    expect(response.status).toBe(500);
  });
});

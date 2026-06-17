import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/stats/global/[gameId]/[squareIndex]/route";

vi.mock("@/services/data.service", () => ({
  default: {
    getGlobalCardPicks: vi.fn(),
  },
}));

import DataService from "@/services/data.service";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(
  gameId: string,
  squareIndex: string,
): [Request, { params: Promise<{ gameId: string; squareIndex: string }> }] {
  return [
    new Request(`http://localhost/api/stats/global/${gameId}/${squareIndex}`),
    { params: Promise.resolve({ gameId, squareIndex }) },
  ];
}

describe("GET /api/stats/global/[gameId]/[squareIndex]", () => {
  it("returns picks when threshold is met", async () => {
    vi.mocked(DataService.getGlobalCardPicks).mockResolvedValue({
      available: true,
      picks: [{ card: "Lightning Bolt", count: 42 }],
    });

    const response = await GET(...makeRequest("1", "0"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.available).toBe(true);
    expect(body.picks).toHaveLength(1);
    expect(DataService.getGlobalCardPicks).toHaveBeenCalledWith(1, 0);
  });

  it("returns available: false when threshold not met", async () => {
    vi.mocked(DataService.getGlobalCardPicks).mockResolvedValue({ available: false });

    const response = await GET(...makeRequest("1", "0"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.available).toBe(false);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(DataService.getGlobalCardPicks).mockRejectedValue(new Error("DB down"));
    const response = await GET(...makeRequest("1", "0"));
    expect(response.status).toBe(500);
  });
});

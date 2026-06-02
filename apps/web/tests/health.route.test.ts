import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { Game } from "@/models/database/game";

vi.mock("@/services/data.service", () => ({
  default: {
    getTodaysGame: vi.fn(),
  },
}));

import DataService from "@/services/data.service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/health", () => {
  it("returns 200 when today's puzzle exists", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(new Game(1, "20260602", "[]"));

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  it("returns 503 when no puzzle exists for today", async () => {
    vi.mocked(DataService.getTodaysGame).mockResolvedValue(undefined);

    const response = await GET();

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("no puzzle");
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(DataService.getTodaysGame).mockRejectedValue(new Error("DB down"));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});

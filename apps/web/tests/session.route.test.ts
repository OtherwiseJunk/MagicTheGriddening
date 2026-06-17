import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/session/route";

vi.mock("@/services/data.service", () => ({
  default: {
    findOrCreatePlayer: vi.fn(),
  },
}));

import DataService from "@/services/data.service";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/session", () => {
  it("returns shortCode for a valid playerId", async () => {
    vi.mocked(DataService.findOrCreatePlayer).mockResolvedValue({ shortCode: "ABCD-1234" });

    const response = await POST(makeRequest({ playerId: "test-uuid" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.shortCode).toBe("ABCD-1234");
    expect(DataService.findOrCreatePlayer).toHaveBeenCalledWith("test-uuid");
  });

  it("returns 400 when playerId is missing", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(DataService.findOrCreatePlayer).mockRejectedValue(new Error("DB down"));
    const response = await POST(makeRequest({ playerId: "test-uuid" }));
    expect(response.status).toBe(500);
  });
});

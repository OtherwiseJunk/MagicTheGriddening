import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/session/restore/route";

vi.mock("@/services/data.service", () => ({
  default: {
    findPlayerByShortCode: vi.fn(),
  },
}));

import DataService from "@/services/data.service";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/session/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/session/restore", () => {
  it("returns playerId when shortCode is found", async () => {
    vi.mocked(DataService.findPlayerByShortCode).mockResolvedValue({ playerId: "found-uuid" });

    const response = await POST(makeRequest({ shortCode: "ABCD-1234" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.playerId).toBe("found-uuid");
  });

  it("returns 404 when shortCode is not found", async () => {
    vi.mocked(DataService.findPlayerByShortCode).mockResolvedValue(undefined);

    const response = await POST(makeRequest({ shortCode: "XXXX-0000" }));

    expect(response.status).toBe(404);
  });

  it("returns 400 when shortCode is missing", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(DataService.findPlayerByShortCode).mockRejectedValue(new Error("DB down"));
    const response = await POST(makeRequest({ shortCode: "ABCD-1234" }));
    expect(response.status).toBe(500);
  });
});

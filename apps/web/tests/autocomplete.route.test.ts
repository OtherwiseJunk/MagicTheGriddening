import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/autocomplete/route";

vi.mock("@/services/autocomplete.service", () => ({
  default: {
    prime: vi.fn(),
    getSuggestions: vi.fn(),
  },
}));

import AutocompleteService from "@/services/autocomplete.service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/autocomplete", () => {
  it("returns autocomplete suggestions", async () => {
    vi.mocked(AutocompleteService.getSuggestions).mockResolvedValue(["Forest", "Forest Bear"]);

    const response = await GET(new Request("http://localhost/api/autocomplete?q=forest"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ options: ["Forest", "Forest Bear"] });
    expect(AutocompleteService.getSuggestions).toHaveBeenCalledWith("forest");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 500 when suggestion lookup fails", async () => {
    vi.mocked(AutocompleteService.getSuggestions).mockRejectedValue(new Error("boom"));

    const response = await GET(new Request("http://localhost/api/autocomplete?q=forest"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});

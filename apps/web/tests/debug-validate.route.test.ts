import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { type LocalCard } from "@/models/local-card";

// Stub only the card lookup; matchesConstraint + the registry localFilters run for real,
// because their real behavior is exactly what this endpoint exists to compare.
vi.mock("@/services/bulk-data.service", () => ({
  default: { findCard: vi.fn() },
}));

import BulkDataService from "@/services/bulk-data.service";
import { POST } from "@/app/api/debug/validate/route";

const findCard = BulkDataService.findCard as unknown as ReturnType<typeof vi.fn>;

function makeCard(overrides: Partial<LocalCard> = {}): LocalCard {
  return {
    name: "Birds of Paradise",
    faceNames: [],
    type_line: "Creature — Bird",
    colors: ["G"],
    cmc: 1,
    rarities: ["rare"],
    oracle_text: "Flying",
    power: "0",
    toughness: "1",
    artists: ["Mark Poole"],
    localizedNames: [],
    sets: ["lea"],
    set: "lea",
    set_name: "Limited Edition Alpha",
    set_type: "core",
    released_at: "1993-08-05",
    imagePng: "http://example.com/bop.png",
    ...overrides,
  };
}

function req(body: unknown): Request {
  return new Request("http://localhost/api/debug/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ENABLE_DEBUG_API = "true";
});

afterEach(() => {
  delete process.env.ENABLE_DEBUG_API;
});

describe("POST /api/debug/validate", () => {
  it("returns 404 when the flag is disabled", async () => {
    delete process.env.ENABLE_DEBUG_API;
    const res = await POST(req({ cardName: "Birds of Paradise", constraints: ["Green", "White"] }));
    expect(res.status).toBe(404);
    expect(findCard).not.toHaveBeenCalled();
  });

  it("reports per-constraint web and filter matches for a valid combo", async () => {
    findCard.mockResolvedValue(makeCard());
    const res = await POST(
      req({ cardName: "Birds of Paradise", constraints: ["Green", "Mark Poole"] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.found).toBe(true);
    expect(body.matchedName).toBe("Birds of Paradise");
    expect(body.card.artists).toContain("Mark Poole");

    const green = body.constraints.find((c: { name: string }) => c.name === "Green");
    expect(green.webMatch).toBe(true);
    expect(green.filterMatch).toBe(true);
    expect(green.agree).toBe(true);

    const poole = body.constraints.find((c: { name: string }) => c.name === "Mark Poole");
    expect(poole.scryfallQuery).toBe("a:Poole");
    expect(poole.webMatch).toBe(true);
    expect(poole.filterMatch).toBe(true);

    expect(body.matchesAll).toBe(true);
  });

  it("returns matchesAll false when one constraint does not match", async () => {
    findCard.mockResolvedValue(makeCard({ colors: ["G"] }));
    const res = await POST(req({ cardName: "Birds of Paradise", constraints: ["Green", "White"] }));
    const body = await res.json();
    const white = body.constraints.find((c: { name: string }) => c.name === "White");
    expect(white.webMatch).toBe(false);
    expect(body.matchesAll).toBe(false);
  });

  it("returns found:false and null card when the card is not in the index", async () => {
    findCard.mockResolvedValue(undefined);
    const res = await POST(req({ cardName: "Nonexistent", constraints: ["Green", "White"] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.found).toBe(false);
    expect(body.card).toBeNull();
    expect(body.matchesAll).toBe(false);
    expect(body.constraints[0].webMatch).toBeNull();
    expect(body.constraints[0].filterMatch).toBeNull();
  });

  it("returns 400 naming an unknown constraint", async () => {
    findCard.mockResolvedValue(makeCard());
    const res = await POST(
      req({ cardName: "Birds of Paradise", constraints: ["Green", "Bogus Constraint"] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Bogus Constraint");
  });

  it("returns 400 when constraints is not exactly two names", async () => {
    const res = await POST(req({ cardName: "Birds of Paradise", constraints: ["Green"] }));
    expect(res.status).toBe(400);
  });

  it("exposes that artist matching is correct for the Morningtide's Light case", async () => {
    findCard.mockResolvedValue(
      makeCard({
        name: "Morningtide's Light",
        artists: ["Mark Poole", "adelinaillustration"],
        colors: ["W"],
        cmc: 4,
        type_line: "Enchantment",
      }),
    );
    const res = await POST(
      req({ cardName: "Morningtide's Light", constraints: ["Mark Poole", "White"] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.found).toBe(true);
    const poole = body.constraints.find((c: { name: string }) => c.name === "Mark Poole");
    expect(poole.webMatch).toBe(true);
    expect(poole.filterMatch).toBe(true);
    expect(poole.agree).toBe(true);
  });
});

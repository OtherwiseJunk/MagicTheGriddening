import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks must be declared before any imports that pull in the real modules.
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();
const mockRename = vi.fn();
const mockRm = vi.fn();
const mockOpen = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  rename: (...args: unknown[]) => mockRename(...args),
  rm: (...args: unknown[]) => mockRm(...args),
  open: (...args: unknown[]) => mockOpen(...args),
}));

vi.mock("node:fs", () => ({ createReadStream: vi.fn() }));
vi.mock("stream-json/streamers/stream-array.js", () => ({
  streamArray: { withParserAsStream: vi.fn() },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.resetAllMocks();
  vi.resetModules();
  mockMkdir.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
  mockRename.mockResolvedValue(undefined);
  mockRm.mockResolvedValue(undefined);
});

async function setupStreamMocks(bulkCards: object[]) {
  const { createReadStream } = await import("node:fs");
  const { streamArray } = await import("stream-json/streamers/stream-array.js");

  mockReadFile.mockRejectedValueOnce(new Error("ENOENT"));
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: [{ type: "all_cards", updated_at: "2024-01-01", download_uri: "https://x.com/c.json" }],
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      body: { [Symbol.asyncIterator]: async function* () { yield new Uint8Array([]); } },
    });
  mockOpen.mockResolvedValue({
    write: vi.fn().mockResolvedValue({ bytesWritten: 0 }),
    close: vi.fn().mockResolvedValue(undefined),
  });

  // Each call to withParserAsStream() returns a fresh mock stream.
  // Both Pass 1 and Pass 2 call withParserAsStream(), so mockReturnValue ensures both
  // get the same stream object — but each [Symbol.asyncIterator]() call creates a new
  // generator, so both passes iterate through the full card list independently.
  vi.mocked(streamArray.withParserAsStream).mockReturnValue({
    on: vi.fn().mockReturnThis(),
    pipe: vi.fn(),
    destroy: vi.fn(),
    [Symbol.asyncIterator]: async function* () {
      for (let i = 0; i < bulkCards.length; i++) yield { key: i, value: bulkCards[i] };
    },
  } as never);
  vi.mocked(createReadStream as ReturnType<typeof vi.fn>).mockReturnValue({
    on: vi.fn().mockReturnThis(),
    pipe: vi.fn(),
  } as never);
}

describe("BulkDataService streaming buildCardIndex", () => {
  it("merges artists, sets, and rarities from all printings of the same card", async () => {
    const bopBase = {
      name: "Birds of Paradise",
      oracle_id: "bop-oracle-id",
      type_line: "Creature — Bird",
      colors: ["G"],
      cmc: 1,
      oracle_text: "Flying\n{T}: Add one mana of any color.",
      power: "0",
      toughness: "1",
      games: ["paper"],
    };
    await setupStreamMocks([
      { ...bopBase, rarity: "rare", artist: "Mark Poole",      set: "lea", set_name: "Limited Edition Alpha", set_type: "core", released_at: "1993-08-05", image_uris: { png: "https://c/alpha.png" } },
      { ...bopBase, rarity: "rare", artist: "Mark Poole",      set: "2ed", set_name: "Unlimited Edition",     set_type: "core", released_at: "1993-12-01", image_uris: { png: "https://c/2ed.png" } },
      { ...bopBase, rarity: "rare", artist: "Stephen Andrade", set: "m10", set_name: "Magic 2010",            set_type: "core", released_at: "2009-07-17", image_uris: { png: "https://c/m10.png" } },
    ]);

    const { default: bulkDataService } = await import("@/services/bulk-data.service");
    const cards = await bulkDataService.getCards();

    expect(cards).toHaveLength(1);
    const bop = cards[0];
    expect(bop.name).toBe("Birds of Paradise");
    expect(bop.artists).toContain("Mark Poole");
    expect(bop.artists).toContain("Stephen Andrade");
    expect(bop.artists).toHaveLength(2);
    expect(bop.sets).toEqual(expect.arrayContaining(["lea", "2ed", "m10"]));
    expect(bop.rarities).toContain("rare");
    expect(bop.rarities).toHaveLength(1);
  });

  it("returns only one card per oracle_id even with many printings", async () => {
    const base = {
      name: "Lightning Bolt",
      oracle_id: "lb-oracle",
      type_line: "Instant",
      colors: [],
      cmc: 1,
      rarity: "common",
      oracle_text: "Lightning Bolt deals 3 damage to any target.",
      image_uris: { png: "https://c/bolt.png" },
      games: ["paper"],
    };
    await setupStreamMocks([
      { ...base, artist: "Christopher Moeller", set: "lea" },
      { ...base, artist: "Christopher Moeller", set: "3ed" },
      { ...base, artist: "Jason Chan",          set: "m11" },
    ]);

    const { default: bulkDataService } = await import("@/services/bulk-data.service");
    const cards = await bulkDataService.getCards();

    expect(cards).toHaveLength(1);
    expect(cards[0].artists).toEqual(expect.arrayContaining(["Christopher Moeller", "Jason Chan"]));
    expect(cards[0].sets).toEqual(expect.arrayContaining(["lea", "3ed", "m11"]));
  });
});

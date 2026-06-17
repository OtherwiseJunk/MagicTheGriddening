import { describe, it, expect, vi, beforeEach } from "vitest";
import { type LocalCard } from "@griddening/shared";

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

vi.mock("node:fs", () => ({
  createReadStream: vi.fn(),
}));

vi.mock("stream-json/streamers/stream-array.js", () => ({
  streamArray: {
    withParserAsStream: vi.fn(),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeCard(overrides: Partial<LocalCard> = {}): LocalCard {
  return {
    name: "Test Card",
    faceNames: [],
    type_line: "Creature — Human",
    colors: ["W"],
    cmc: 2,
    rarities: ["common"],
    oracle_text: "",
    power: "2",
    toughness: "2",
    artists: ["Test Artist"],
    localizedNames: [],
    sets: ["m21"],
    set: "m21",
    set_name: "Core Set 2021",
    set_type: "core",
    released_at: "2020-07-03",
    imagePng: "",
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockMkdir.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
  mockRename.mockResolvedValue(undefined);
  mockRm.mockResolvedValue(undefined);
});

describe("CardDataService", () => {
  describe("loading from disk", () => {
    it("returns cards from card-index.json when file exists", async () => {
      const cards: LocalCard[] = [makeCard({ name: "Lightning Bolt" })];
      const indexFile = {
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: "2024-01-01",
        cards,
      };
      mockReadFile.mockResolvedValue(JSON.stringify(indexFile));

      const { CardDataService } = await import("../services/card-data.service.js");
      const service = new CardDataService();
      const result = await service.getCards();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Lightning Bolt");
    });

    it("downloads and saves cards when card-index.json does not exist", async () => {
      const { createReadStream } = await import("node:fs");
      const { streamArray } = await import("stream-json/streamers/stream-array.js");

      const bulkCard = {
        name: "Llanowar Elves",
        oracle_id: "abc123",
        type_line: "Creature — Elf Druid",
        colors: ["G"],
        cmc: 1,
        rarity: "common",
        oracle_text: "{T}: Add {G}.",
        power: "1",
        toughness: "1",
        artist: "Some Artist",
        set: "m21",
        set_name: "Core Set 2021",
        set_type: "core",
        released_at: "2020-07-03",
        image_uris: { png: "https://example.com/llanowar.png" },
        games: ["paper"],
      };

      mockReadFile.mockRejectedValueOnce(new Error("ENOENT: no such file"));

      const manifestResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            {
              type: "all_cards",
              updated_at: "2024-01-01",
              download_uri: "https://example.com/cards.json",
            },
          ],
        }),
      };
      const bulkResponse = {
        ok: true,
        body: {
          [Symbol.asyncIterator]: async function* () {
            yield new Uint8Array([]);
          },
        },
      };
      mockFetch.mockResolvedValueOnce(manifestResponse).mockResolvedValueOnce(bulkResponse);

      const mockFileHandle = {
        write: vi.fn().mockResolvedValue({ bytesWritten: 0 }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      mockOpen.mockResolvedValue(mockFileHandle);

      const mockStream = {
        on: vi.fn().mockReturnThis(),
        pipe: vi.fn(),
        destroy: vi.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield { key: 0, value: bulkCard };
        },
      };
      vi.mocked(streamArray.withParserAsStream).mockReturnValue(mockStream as never);
      vi.mocked(createReadStream as ReturnType<typeof vi.fn>).mockReturnValue({
        on: vi.fn().mockReturnThis(),
        pipe: vi.fn(),
      } as never);

      const { CardDataService } = await import("../services/card-data.service.js");
      const service = new CardDataService();
      const result = await service.getCards();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe("Llanowar Elves");
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe("multi-printing accumulation", () => {
    async function setupDownloadMocks(cards: object[]) {
      const { createReadStream } = await import("node:fs");
      const { streamArray } = await import("stream-json/streamers/stream-array.js");

      mockReadFile.mockRejectedValueOnce(new Error("ENOENT: no such file"));
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
      mockOpen.mockResolvedValue({ write: vi.fn().mockResolvedValue({ bytesWritten: 0 }), close: vi.fn().mockResolvedValue(undefined) });

      vi.mocked(streamArray.withParserAsStream).mockReturnValue({
        on: vi.fn().mockReturnThis(),
        pipe: vi.fn(),
        destroy: vi.fn(),
        [Symbol.asyncIterator]: async function* () {
          for (let i = 0; i < cards.length; i++) yield { key: i, value: cards[i] };
        },
      } as never);
      vi.mocked(createReadStream as ReturnType<typeof vi.fn>).mockReturnValue({ on: vi.fn().mockReturnThis(), pipe: vi.fn() } as never);
    }

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
      await setupDownloadMocks([
        { ...bopBase, rarity: "rare", artist: "Mark Poole", set: "lea", set_name: "Limited Edition Alpha", set_type: "core", released_at: "1993-08-05", image_uris: { png: "https://c/alpha.png" } },
        { ...bopBase, rarity: "rare", artist: "Mark Poole", set: "2ed", set_name: "Unlimited Edition", set_type: "core", released_at: "1993-12-01", image_uris: { png: "https://c/2ed.png" } },
        { ...bopBase, rarity: "rare", artist: "Stephen Andrade", set: "m10", set_name: "Magic 2010", set_type: "core", released_at: "2009-07-17", image_uris: { png: "https://c/m10.png" } },
      ]);

      const { CardDataService } = await import("../services/card-data.service.js");
      const result = await new CardDataService().getCards();

      expect(result).toHaveLength(1);
      const bop = result[0];
      expect(bop.name).toBe("Birds of Paradise");
      expect(bop.artists).toContain("Mark Poole");
      expect(bop.artists).toContain("Stephen Andrade");
      expect(bop.artists).toHaveLength(2); // deduped
      expect(bop.sets).toContain("lea");
      expect(bop.sets).toContain("2ed");
      expect(bop.sets).toContain("m10");
      expect(bop.rarities).toContain("rare");
      expect(bop.rarities).toHaveLength(1); // all rare, no duplicates
    });

    it("merges null-oracle_id printings into the canonical entry by name", async () => {
      // One Secret Lair BOP has oracle_id=null. Rather than being dropped or creating a
      // colliding second entry, its artists/sets/rarities are folded into the canonical BOP.
      // This preserves Secret Lair artist-series credits (e.g. Okubo, Villeneuve series).
      const bopBase = { name: "Birds of Paradise", type_line: "Creature — Bird", colors: ["G"], cmc: 1, rarity: "rare", set_name: "Test", set_type: "core", image_uris: { png: "https://c/bop.png" }, games: ["paper"] };
      const alphaBop    = { ...bopBase, oracle_id: "bop-real", artist: "Mark Poole", set: "lea", released_at: "1993-08-05" };
      const sldBopNewer = { ...bopBase, oracle_id: undefined,  artist: "Okubo",      set: "sld", released_at: "2024-01-01" };
      await setupDownloadMocks([alphaBop, sldBopNewer]);

      const { CardDataService } = await import("../services/card-data.service.js");
      const result = await new CardDataService().getCards();

      expect(result).toHaveLength(1);
      expect(result[0].artists).toContain("Mark Poole");
      expect(result[0].artists).toContain("Okubo");
      expect(result[0].sets).toContain("sld");
    });

    it("collects non-English card names into localizedNames", async () => {
      const bopBase = { name: "Birds of Paradise", oracle_id: "bop-oracle", type_line: "Creature — Bird", colors: ["G"], cmc: 1, rarity: "rare", set_name: "Limited Edition Alpha", set_type: "core", image_uris: { png: "https://c/bop.png" }, games: ["paper"] };
      await setupDownloadMocks([
        { ...bopBase, artist: "Mark Poole", set: "lea", released_at: "1993-08-05" },
        { ...bopBase, name: "楽園の鳥", lang: "ja", artist: "Mark Poole", set: "lea", released_at: "1993-08-05" },
        { ...bopBase, name: "Oiseau du Paradis", lang: "fr", artist: "Mark Poole", set: "lea", released_at: "1993-08-05" },
      ]);

      const { CardDataService } = await import("../services/card-data.service.js");
      const result = await new CardDataService().getCards();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Birds of Paradise");
      expect(result[0].localizedNames).toContain("楽園の鳥");
      expect(result[0].localizedNames).toContain("Oiseau du Paradis");
    });

    it("correctly populates rarities (not undefined)", async () => {
      await setupDownloadMocks([{
        name: "Lightning Bolt", oracle_id: "lb-oracle",
        type_line: "Instant", colors: [], cmc: 1, rarity: "common",
        oracle_text: "Lightning Bolt deals 3 damage to any target.",
        artist: "Some Artist", set: "lea", set_name: "Limited Edition Alpha", set_type: "core",
        released_at: "1993-08-05", image_uris: { png: "https://c/bolt.png" }, games: ["paper"],
      }]);

      const { CardDataService } = await import("../services/card-data.service.js");
      const bolt = (await new CardDataService().getCards())[0];

      expect(bolt.rarities).toBeDefined();
      expect(Array.isArray(bolt.rarities)).toBe(true);
      expect(bolt.rarities).toContain("common");
    });
  });

  describe("getCards", () => {
    it("returns the same cards on repeated calls without re-fetching", async () => {
      const cards: LocalCard[] = [makeCard({ name: "Counterspell" })];
      const indexFile = {
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: "2024-01-01",
        cards,
      };
      mockReadFile.mockResolvedValue(JSON.stringify(indexFile));

      const { CardDataService } = await import("../services/card-data.service.js");
      const service = new CardDataService();
      await service.getCards();
      await service.getCards();

      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSets", () => {
    it("returns sets stored in the index file when present", async () => {
      const indexFile = {
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: "2024-01-01",
        cards: [makeCard()],
        sets: [
          {
            code: "ktk",
            name: "Khans of Tarkir",
            set_type: "expansion",
            released_at: "2014-09-26",
          },
          { code: "m21", name: "Core Set 2021", set_type: "core", released_at: "2020-07-03" },
        ],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(indexFile));

      const { CardDataService } = await import("../services/card-data.service.js");
      const service = new CardDataService();
      const sets = await service.getSets();

      expect(sets).toHaveLength(2);
      expect(sets.find((s) => s.code === "ktk")).toMatchObject({
        code: "ktk",
        name: "Khans of Tarkir",
      });
    });

    it("falls back to building sets from card.set when index has no sets field", async () => {
      const indexFile = {
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: "2024-01-01",
        cards: [
          makeCard({
            set: "ktk",
            set_name: "Khans of Tarkir",
            set_type: "expansion",
            released_at: "2014-09-26",
          }),
          makeCard({
            set: "ktk",
            set_name: "Khans of Tarkir",
            set_type: "expansion",
            released_at: "2014-09-26",
          }),
          makeCard({
            set: "m21",
            set_name: "Core Set 2021",
            set_type: "core",
            released_at: "2020-07-03",
          }),
        ],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(indexFile));

      const { CardDataService } = await import("../services/card-data.service.js");
      const service = new CardDataService();
      const sets = await service.getSets();

      expect(sets).toHaveLength(2);
      expect(sets.find((s) => s.code === "ktk")).toMatchObject({
        code: "ktk",
        name: "Khans of Tarkir",
        set_type: "expansion",
        released_at: "2014-09-26",
      });
      expect(sets.find((s) => s.code === "m21")).toMatchObject({
        code: "m21",
        name: "Core Set 2021",
        set_type: "core",
      });
    });
  });
});

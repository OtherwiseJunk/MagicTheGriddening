import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocalCard } from "../types/LocalCard.js";

const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();
const mockRename = vi.fn();
const mockRm = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  rename: (...args: unknown[]) => mockRename(...args),
  rm: (...args: unknown[]) => mockRm(...args),
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
    rarity: "common",
    oracle_text: "",
    power: "2",
    toughness: "2",
    artist: "Test Artist",
    set: "m21",
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
      const bulkCard = {
        name: "Llanowar Elves",
        type_line: "Creature — Elf Druid",
        colors: ["G"],
        cmc: 1,
        rarity: "common",
        oracle_text: "{T}: Add {G}.",
        power: "1",
        toughness: "1",
        artist: "Some Artist",
        set: "m21",
        image_uris: { png: "https://example.com/llanowar.png" },
        games: ["paper"],
      };

      // First readFile call (index file) fails; second (temp bulk file) returns raw cards
      mockReadFile
        .mockRejectedValueOnce(new Error("ENOENT: no such file"))
        .mockResolvedValueOnce(JSON.stringify([bulkCard]));

      const manifestResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            {
              type: "oracle_cards",
              updated_at: "2024-01-01",
              download_uri: "https://example.com/cards.json",
            },
          ],
        }),
      };
      const bulkResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      };
      mockFetch.mockResolvedValueOnce(manifestResponse).mockResolvedValueOnce(bulkResponse);

      const { CardDataService } = await import("../services/card-data.service.js");
      const service = new CardDataService();
      const result = await service.getCards();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe("Llanowar Elves");
      expect(mockWriteFile).toHaveBeenCalled();
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
    it("returns unique sets extracted from the card index", async () => {
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

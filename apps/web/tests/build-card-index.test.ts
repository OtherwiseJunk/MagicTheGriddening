import { describe, it, expect, afterEach } from "vitest";
import { writeFile, rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildCardIndex } from "@griddening/shared";

// These tests run the REAL buildCardIndex against REAL temp files, so they exercise the
// actual stream-json parse path (including SlicedString behavior). No mocks.

const tmpFiles: string[] = [];

afterEach(async () => {
  await Promise.all(tmpFiles.splice(0).map((f) => rm(f, { force: true })));
});

async function indexOf(cards: Record<string, unknown>[]) {
  const dir = await mkdtemp(path.join(tmpdir(), "bci-"));
  const file = path.join(dir, "bulk.json");
  tmpFiles.push(file);
  await writeFile(file, JSON.stringify(cards), "utf8");
  return buildCardIndex(file);
}

// Minimal paper/English card with required fields filled in.
function card(over: Record<string, unknown>): Record<string, unknown> {
  return {
    name: "Default Name",
    oracle_id: "default-oracle",
    lang: "en",
    games: ["paper"],
    type_line: "Creature",
    colors: [],
    cmc: 0,
    rarity: "common",
    oracle_text: "",
    set: "xxx",
    set_name: "Default Set",
    set_type: "expansion",
    released_at: "2020-01-01",
    image_uris: { png: "https://img/default.png" },
    ...over,
  };
}

describe("buildCardIndex behavior matrix", () => {
  it("merges artists, sets, and rarities across all printings of one oracle_id", async () => {
    const { cards } = await indexOf([
      card({ oracle_id: "bop", name: "Birds of Paradise", rarity: "rare", artist: "Mark Poole", set: "lea" }),
      card({ oracle_id: "bop", name: "Birds of Paradise", rarity: "rare", artist: "Mark Poole", set: "2ed" }),
      card({ oracle_id: "bop", name: "Birds of Paradise", rarity: "rare", artist: "Stephen Andrade", set: "m10" }),
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0].artists.sort()).toEqual(["Mark Poole", "Stephen Andrade"]);
    expect(cards[0].sets.sort()).toEqual(["2ed", "lea", "m10"]);
    expect(cards[0].rarities).toEqual(["rare"]);
  });

  it("uses the first English printing in stream order for static fields", async () => {
    const { cards } = await indexOf([
      card({ oracle_id: "x", name: "First Name", type_line: "Instant", set: "aaa", image_uris: { png: "https://img/first.png" } }),
      card({ oracle_id: "x", name: "Second Name", type_line: "Sorcery", set: "bbb", image_uris: { png: "https://img/second.png" } }),
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("First Name");
    expect(cards[0].type_line).toBe("Instant");
    expect(cards[0].imagePng).toBe("https://img/first.png");
  });

  it("collects non-English names into localizedNames of the matching oracle_id", async () => {
    const { cards } = await indexOf([
      card({ oracle_id: "lb", name: "Lightning Bolt" }),
      card({ oracle_id: "lb", name: "稲妻", lang: "ja" }),
      card({ oracle_id: "lb", name: "Blitzschlag", lang: "de" }),
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("Lightning Bolt");
    expect(cards[0].localizedNames.sort()).toEqual(["Blitzschlag", "稲妻"]);
  });

  it("drops an oracle_id that has only non-English printings", async () => {
    const { cards } = await indexOf([
      card({ oracle_id: "en-card", name: "English Only" }),
      card({ oracle_id: "ja-only", name: "日本語のみ", lang: "ja" }),
    ]);
    expect(cards.map((c) => c.name)).toEqual(["English Only"]);
  });

  it("merges null-oracle_id English printings into the canonical card by name", async () => {
    const { cards } = await indexOf([
      card({ oracle_id: "goyf", name: "Tarmogoyf", artist: "Justin Murray", set: "fut" }),
      card({ oracle_id: undefined, name: "Tarmogoyf", artist: "Promo Artist", set: "promo", rarity: "mythic" }),
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0].artists.sort()).toEqual(["Justin Murray", "Promo Artist"]);
    expect(cards[0].sets.sort()).toEqual(["fut", "promo"]);
    expect(cards[0].rarities.sort()).toEqual(["common", "mythic"]);
  });

  it("derives colors from the union of face colors when top-level colors is absent", async () => {
    const { cards } = await indexOf([
      card({
        oracle_id: "dfc",
        name: "Valki, God of Lies",
        colors: undefined,
        card_faces: [
          { name: "Valki, God of Lies", colors: ["B"] },
          { name: "Tibalt, Cosmic Impostor", colors: ["R"] },
        ],
      }),
    ]);
    expect(cards[0].colors.sort()).toEqual(["B", "R"]);
  });

  it("populates faceNames for multi-faced cards and leaves them empty otherwise", async () => {
    const { cards } = await indexOf([
      card({ oracle_id: "single", name: "Single Faced" }),
      card({
        oracle_id: "dfc2",
        name: "Front // Back",
        card_faces: [{ name: "Front" }, { name: "Back" }],
      }),
    ]);
    const byName = Object.fromEntries(cards.map((c) => [c.name, c]));
    expect(byName["Single Faced"].faceNames).toEqual([]);
    expect(byName["Front // Back"].faceNames).toEqual(["Front", "Back"]);
  });

  it("joins face oracle_text with newlines when top-level oracle_text is absent", async () => {
    const { cards } = await indexOf([
      card({
        oracle_id: "dfc3",
        name: "Two Texts",
        oracle_text: undefined,
        card_faces: [
          { name: "A", oracle_text: "Front text." },
          { name: "B", oracle_text: "Back text." },
        ],
      }),
    ]);
    expect(cards[0].oracle_text).toBe("Front text.\nBack text.");
  });

  it("falls back to /card-not-found.png when no image is present", async () => {
    const { cards } = await indexOf([
      card({ oracle_id: "noimg", name: "No Image", image_uris: undefined }),
    ]);
    expect(cards[0].imagePng).toBe("/card-not-found.png");
  });

  it("falls back to color_identity when neither card nor faces declare colors", async () => {
    const { cards } = await indexOf([
      card({ oracle_id: "devoid", name: "Identity Only", colors: undefined, color_identity: ["G"] }),
    ]);
    expect(cards[0].colors).toEqual(["G"]);
  });

  it("excludes non-paper cards entirely", async () => {
    const { cards } = await indexOf([
      card({ oracle_id: "paper", name: "Paper Card" }),
      card({ oracle_id: "digital", name: "Arena Card", games: ["arena", "mtgo"] }),
    ]);
    expect(cards.map((c) => c.name)).toEqual(["Paper Card"]);
  });

  it("returns a deduplicated set list built from English printings", async () => {
    const { sets } = await indexOf([
      card({ oracle_id: "a", name: "A", set: "lea", set_name: "Alpha", set_type: "core" }),
      card({ oracle_id: "b", name: "B", set: "lea", set_name: "Alpha", set_type: "core" }),
      card({ oracle_id: "c", name: "C", set: "m10", set_name: "Magic 2010", set_type: "core" }),
    ]);
    expect(sets.map((s) => s.code).sort()).toEqual(["lea", "m10"]);
    const alpha = sets.find((s) => s.code === "lea")!;
    expect(alpha.name).toBe("Alpha");
  });
});

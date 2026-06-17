import { describe, it, expect } from "vitest";
import { buildLocalCards } from "@/models/local-card";

const singleFaced = {
  name: "Lightning Bolt",
  oracle_id: "aaaaaaaa-0000-0000-0000-000000000001",
  type_line: "Instant",
  colors: ["R"],
  color_identity: ["R"],
  cmc: 1,
  rarity: "common",
  oracle_text: "Lightning Bolt deals 3 damage to any target.",
  artist: "Christopher Moeller",
  set: "lea",
  image_uris: { png: "https://cards.scryfall.io/png/front/e/9/e9d5aee0.png" },
  games: ["paper"],
};

const doubleFaced = {
  name: "Delver of Secrets // Insectile Aberration",
  oracle_id: "aaaaaaaa-0000-0000-0000-000000000002",
  type_line: "Creature — Human Wizard // Creature — Human Insect",
  color_identity: ["U"],
  cmc: 1,
  rarity: "common",
  artist: "Nils Hamm",
  set: "isd",
  games: ["paper"],
  card_faces: [
    {
      name: "Delver of Secrets",
      colors: ["U"],
      oracle_text: "At the beginning of your upkeep, look at the top card of your library.",
      artist: "Nils Hamm",
      power: "1",
      toughness: "1",
      image_uris: { png: "https://cards.scryfall.io/png/front/6/9/delver.png" },
    },
    {
      name: "Insectile Aberration",
      colors: ["U"],
      oracle_text: "Flying",
      artist: "Nils Hamm",
      power: "3",
      toughness: "2",
      image_uris: { png: "https://cards.scryfall.io/png/back/6/9/delver.png" },
    },
  ],
};

const digitalOnly = {
  name: "Digital Card",
  oracle_id: "aaaaaaaa-0000-0000-0000-000000000003",
  type_line: "Creature",
  colors: [],
  color_identity: [],
  cmc: 2,
  rarity: "common",
  oracle_text: "",
  artist: "Some Artist",
  set: "ana",
  image_uris: { png: "https://example.com/digital.png" },
  games: ["arena"],
};

describe("buildLocalCards", () => {
  it("filters out non-paper cards", () => {
    const result = buildLocalCards([digitalOnly]);
    expect(result).toHaveLength(0);
  });

  it("maps single-faced card fields correctly", () => {
    const [card] = buildLocalCards([singleFaced]);
    expect(card.name).toBe("Lightning Bolt");
    expect(card.faceNames).toEqual([]);
    expect(card.type_line).toBe("Instant");
    expect(card.colors).toEqual(["R"]);
    expect(card.cmc).toBe(1);
    expect(card.rarities).toEqual(["common"]);
    expect(card.oracle_text).toBe("Lightning Bolt deals 3 damage to any target.");
    expect(card.artists).toEqual(["Christopher Moeller"]);
    expect(card.sets).toEqual(["lea"]);
    expect(card.imagePng).toBe("https://cards.scryfall.io/png/front/e/9/e9d5aee0.png");
    expect(card.power).toBeUndefined();
    expect(card.toughness).toBeUndefined();
  });

  it("maps double-faced card: unions face colors, concatenates oracle_text, uses face[0] image", () => {
    const [card] = buildLocalCards([doubleFaced]);
    expect(card.name).toBe("Delver of Secrets // Insectile Aberration");
    expect(card.faceNames).toEqual(["Delver of Secrets", "Insectile Aberration"]);
    expect(card.colors).toEqual(["U"]);
    expect(card.oracle_text).toBe(
      "At the beginning of your upkeep, look at the top card of your library.\nFlying",
    );
    expect(card.power).toBe("1");
    expect(card.toughness).toBe("1");
    expect(card.imagePng).toBe("https://cards.scryfall.io/png/front/6/9/delver.png");
  });

  it("falls back to /card-not-found.png when no image available", () => {
    const noImage = { ...singleFaced, image_uris: undefined, games: ["paper"] };
    const [card] = buildLocalCards([noImage]);
    expect(card.imagePng).toBe("/card-not-found.png");
  });

  it("falls back to artist from card_faces[0] when top-level artist absent", () => {
    const noTopLevelArtist = { ...doubleFaced, artist: undefined };
    const [card] = buildLocalCards([noTopLevelArtist]);
    expect(card.artists).toEqual(["Nils Hamm"]);
  });

  it("falls back to color_identity when no colors on card or faces", () => {
    const noColors = {
      ...doubleFaced,
      card_faces: doubleFaced.card_faces.map((f) => ({ ...f, colors: undefined })),
    };
    const [card] = buildLocalCards([noColors]);
    expect(card.colors).toEqual(["U"]);
  });

  it("deduplicates printings by oracle_id, collecting all rarities, sets, and artists", () => {
    const reprint = {
      ...singleFaced,
      rarity: "uncommon",
      set: "m11",
      artist: "Jason Chan",
    };
    const [card] = buildLocalCards([singleFaced, reprint]);
    expect(card.rarities).toEqual(expect.arrayContaining(["common", "uncommon"]));
    expect(card.sets).toEqual(expect.arrayContaining(["lea", "m11"]));
    expect(card.artists).toEqual(expect.arrayContaining(["Christopher Moeller", "Jason Chan"]));
  });
});

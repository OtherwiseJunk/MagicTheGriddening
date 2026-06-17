import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { matchesConstraint } from "@/services/card-validation.service";
import { GameConstraint, ConstraintType } from "@griddening/shared";
import { type LocalCard, type CardIndexFile } from "@/models/local-card";

function makeCard(overrides: Partial<LocalCard> = {}): LocalCard {
  return {
    name: "Test Card",
    faceNames: [],
    type_line: "Creature — Human Wizard",
    colors: ["R"],
    cmc: 3,
    rarities: ["rare"],
    oracle_text: "Flying\nHaste",
    power: "2",
    toughness: "2",
    artists: ["Rebecca Guay"],
    localizedNames: [],
    sets: ["m20"],
    set: "m20",
    set_name: "Core Set 2020",
    set_type: "core",
    released_at: "2019-07-12",
    imagePng: "/card.png",
    ...overrides,
  };
}

describe("matchesConstraint", () => {
  describe("Type / CreatureRaceTypes / CreatureJobTypes / ArtifactSubtypes / EnchantmentSubtypes", () => {
    it("matches when type_line contains the type", () => {
      const card = makeCard({ type_line: "Creature — Goblin Warrior" });
      expect(
        matchesConstraint(card, new GameConstraint("Goblin", ConstraintType.CreatureRaceTypes, "t:goblin")),
      ).toBe(true);
    });

    it("does not match when type_line lacks the type", () => {
      const card = makeCard({ type_line: "Instant" });
      expect(
        matchesConstraint(card, new GameConstraint("Goblin", ConstraintType.CreatureRaceTypes, "t:goblin")),
      ).toBe(false);
    });

    it("handles negation: -t:land -t:artifact", () => {
      const card = makeCard({ type_line: "Creature — Human" });
      expect(
        matchesConstraint(card, new GameConstraint("Non-Land Non-Artifact", ConstraintType.Type, "-t:land -t:artifact")),
      ).toBe(true);
    });

    it("fails negation when type_line contains excluded type", () => {
      const card = makeCard({ type_line: "Artifact Creature — Construct" });
      expect(
        matchesConstraint(card, new GameConstraint("Non-Land Non-Artifact", ConstraintType.Type, "-t:land -t:artifact")),
      ).toBe(false);
    });

    it("is case-insensitive for type matching", () => {
      const card = makeCard({ type_line: "Creature — Elf Druid" });
      expect(
        matchesConstraint(card, new GameConstraint("Elf", ConstraintType.CreatureRaceTypes, "t:Elf")),
      ).toBe(true);
    });
  });

  describe("Rarity", () => {
    it("matches mythic with r:m", () => {
      const card = makeCard({ rarities: ["mythic"] });
      expect(
        matchesConstraint(card, new GameConstraint("Mythic", ConstraintType.Rarity, "r:m")),
      ).toBe(true);
    });

    it("matches rare with r:r", () => {
      const card = makeCard({ rarities: ["rare"] });
      expect(
        matchesConstraint(card, new GameConstraint("Rare", ConstraintType.Rarity, "r:r")),
      ).toBe(true);
    });

    it("matches uncommon with r:u", () => {
      const card = makeCard({ rarities: ["uncommon"] });
      expect(
        matchesConstraint(card, new GameConstraint("Uncommon", ConstraintType.Rarity, "r:u")),
      ).toBe(true);
    });

    it("matches common with r:c", () => {
      const card = makeCard({ rarities: ["common"] });
      expect(
        matchesConstraint(card, new GameConstraint("Common", ConstraintType.Rarity, "r:c")),
      ).toBe(true);
    });

    it("does not match wrong rarity", () => {
      const card = makeCard({ rarities: ["uncommon"] });
      expect(
        matchesConstraint(card, new GameConstraint("Rare", ConstraintType.Rarity, "r:r")),
      ).toBe(false);
    });

    it("matches when any printing rarity satisfies constraint", () => {
      const card = makeCard({ rarities: ["uncommon", "common"] });
      expect(
        matchesConstraint(card, new GameConstraint("Common", ConstraintType.Rarity, "r:c")),
      ).toBe(true);
    });
  });

  describe("Color", () => {
    it("matches single color c:R", () => {
      const card = makeCard({ colors: ["R"] });
      expect(
        matchesConstraint(card, new GameConstraint("Red", ConstraintType.Color, "c:R")),
      ).toBe(true);
    });

    it("matches multi-color card for single-color query", () => {
      const card = makeCard({ colors: ["R", "G"] });
      expect(
        matchesConstraint(card, new GameConstraint("Red", ConstraintType.Color, "c:R")),
      ).toBe(true);
    });

    it("does not match when color absent", () => {
      const card = makeCard({ colors: ["U"] });
      expect(
        matchesConstraint(card, new GameConstraint("Red", ConstraintType.Color, "c:R")),
      ).toBe(false);
    });

    it("matches color negation: non-red card satisfies -c:R", () => {
      const card = makeCard({ colors: ["U"] });
      expect(
        matchesConstraint(card, new GameConstraint("Non-Red", ConstraintType.Color, "-c:R")),
      ).toBe(true);
    });

    it("does not match color negation when card has excluded color", () => {
      const card = makeCard({ colors: ["R"] });
      expect(
        matchesConstraint(card, new GameConstraint("Non-Red", ConstraintType.Color, "-c:R")),
      ).toBe(false);
    });

    it("matches colorless with c:C -c:W -c:U -c:B -c:R -c:G", () => {
      const card = makeCard({ colors: [] });
      expect(
        matchesConstraint(
          card,
          new GameConstraint("Colorless", ConstraintType.Color, "c:C -c:W -c:U -c:B -c:R -c:G"),
        ),
      ).toBe(true);
    });

    it("does not match colorless query for a colored card", () => {
      const card = makeCard({ colors: ["R"] });
      expect(
        matchesConstraint(
          card,
          new GameConstraint("Colorless", ConstraintType.Color, "c:C -c:W -c:U -c:B -c:R -c:G"),
        ),
      ).toBe(false);
    });
  });

  describe("ManaValue", () => {
    it("matches exact cmc", () => {
      const card = makeCard({ cmc: 3 });
      expect(
        matchesConstraint(card, new GameConstraint("Mana Value 3", ConstraintType.ManaValue, "cmc:3")),
      ).toBe(true);
    });

    it("does not match different cmc", () => {
      const card = makeCard({ cmc: 2 });
      expect(
        matchesConstraint(card, new GameConstraint("Mana Value 3", ConstraintType.ManaValue, "cmc:3")),
      ).toBe(false);
    });
  });

  describe("Power", () => {
    it("matches exact power string", () => {
      const card = makeCard({ power: "5" });
      expect(
        matchesConstraint(card, new GameConstraint("Power 5", ConstraintType.Power, "pow:5")),
      ).toBe(true);
    });

    it("does not match when power is undefined", () => {
      const card = makeCard({ power: undefined });
      expect(
        matchesConstraint(card, new GameConstraint("Power 1", ConstraintType.Power, "pow:1")),
      ).toBe(false);
    });

    it("does not match star power", () => {
      const card = makeCard({ power: "*" });
      expect(
        matchesConstraint(card, new GameConstraint("Power 2", ConstraintType.Power, "pow:2")),
      ).toBe(false);
    });
  });

  describe("Toughness", () => {
    it("matches exact toughness string", () => {
      const card = makeCard({ toughness: "6" });
      expect(
        matchesConstraint(card, new GameConstraint("Toughness 6", ConstraintType.Toughness, "tou:6")),
      ).toBe(true);
    });

    it("does not match wrong toughness", () => {
      const card = makeCard({ toughness: "4" });
      expect(
        matchesConstraint(card, new GameConstraint("Toughness 6", ConstraintType.Toughness, "tou:6")),
      ).toBe(false);
    });

    it("does not match when toughness is undefined", () => {
      const card = makeCard({ toughness: undefined });
      expect(
        matchesConstraint(card, new GameConstraint("Toughness 1", ConstraintType.Toughness, "tou:1")),
      ).toBe(false);
    });
  });

  describe("Artist", () => {
    it("matches partial surname (case-insensitive)", () => {
      const card = makeCard({ artists: ["Rebecca Guay"] });
      expect(
        matchesConstraint(card, new GameConstraint("Rebecca Guay", ConstraintType.Artist, "a:Guay")),
      ).toBe(true);
    });

    it("does not match unrelated artist", () => {
      const card = makeCard({ artists: ["John Avon"] });
      expect(
        matchesConstraint(card, new GameConstraint("Rebecca Guay", ConstraintType.Artist, "a:Guay")),
      ).toBe(false);
    });

    it("matches when any printing artist satisfies constraint", () => {
      const card = makeCard({ artists: ["John Avon", "Rebecca Guay"] });
      expect(
        matchesConstraint(card, new GameConstraint("Rebecca Guay", ConstraintType.Artist, "a:Guay")),
      ).toBe(true);
    });
  });

  describe("CreatureRulesText", () => {
    it("matches single keyword o:Flying", () => {
      const card = makeCard({ oracle_text: "Flying\nHaste" });
      expect(
        matchesConstraint(card, new GameConstraint("Flying", ConstraintType.CreatureRulesText, "o:Flying")),
      ).toBe(true);
    });

    it("matches quoted multi-word keyword o:\"Double Strike\"", () => {
      const card = makeCard({ oracle_text: "Double Strike\nFirst Strike" });
      expect(
        matchesConstraint(
          card,
          new GameConstraint("Double Strike", ConstraintType.CreatureRulesText, 'o:"Double Strike"'),
        ),
      ).toBe(true);
    });

    it("substitutes ~ with card name for o:\"~ attacks each combat if able\"", () => {
      const card = makeCard({
        name: "Goblin Guide",
        oracle_text: "Haste\nGoblin Guide attacks each combat if able.",
      });
      expect(
        matchesConstraint(
          card,
          new GameConstraint(
            "Attacks Each Combat",
            ConstraintType.CreatureRulesText,
            'o:"~ attacks each combat if able"',
          ),
        ),
      ).toBe(true);
    });

    it("substitutes ~ with card name for o:\"~ enters the battlefield tapped\"", () => {
      const card = makeCard({
        name: "Bojuka Bog",
        oracle_text: "Bojuka Bog enters the battlefield tapped.\n{T}: Add {B}.",
        type_line: "Land",
      });
      expect(
        matchesConstraint(
          card,
          new GameConstraint(
            "Enters the Battlefield Tapped",
            ConstraintType.CreatureRulesText,
            'o:"~ enters the battlefield tapped"',
          ),
        ),
      ).toBe(true);
    });

    it("uses faceNames[0] for ~ substitution on double-faced cards", () => {
      const card = makeCard({
        name: "Werewolf Card // Wolf Form",
        faceNames: ["Werewolf Card", "Wolf Form"],
        oracle_text: "Werewolf Card can't block.",
      });
      expect(
        matchesConstraint(
          card,
          new GameConstraint("Can't Block", ConstraintType.CreatureRulesText, 'o:"~ can\'t block"'),
        ),
      ).toBe(true);
    });

    it("does not match when keyword absent from oracle_text", () => {
      const card = makeCard({ oracle_text: "Flying" });
      expect(
        matchesConstraint(card, new GameConstraint("Trample", ConstraintType.CreatureRulesText, "o:Trample")),
      ).toBe(false);
    });

    it("returns false for malformed oracle query missing o: prefix", () => {
      const card = makeCard({ oracle_text: "Flying" });
      expect(
        matchesConstraint(card, new GameConstraint("Flying", ConstraintType.CreatureRulesText, "Flying")),
      ).toBe(false);
    });
  });

  describe("unknown ConstraintType", () => {
    it("returns false for __LENGTH sentinel", () => {
      const card = makeCard();
      expect(
        matchesConstraint(card, new GameConstraint("Unknown", ConstraintType.__LENGTH, "t:creature")),
      ).toBe(false);
    });
  });
});

// Integration tests: validate against the actual e2e card-index.json to catch data-format regressions.
// These fail if card-index.json uses the old singular "artist"/"rarity" shape instead of arrays.
describe("validation against real card-index.json data", () => {
  const { cards } = JSON.parse(
    readFileSync(path.resolve(__dirname, "../e2e/card-index.json"), "utf8"),
  ) as CardIndexFile;

  it("all cards have artists as a non-empty array", () => {
    for (const card of cards) {
      expect(Array.isArray(card.artists), `${card.name}: artists must be an array`).toBe(true);
      expect(card.artists.length, `${card.name}: artists must not be empty`).toBeGreaterThan(0);
    }
  });

  it("all cards have rarities as an array", () => {
    for (const card of cards) {
      expect(Array.isArray(card.rarities), `${card.name}: rarities must be an array`).toBe(true);
    }
  });

  it("all cards have sets as an array", () => {
    for (const card of cards) {
      expect(Array.isArray(card.sets), `${card.name}: sets must be an array`).toBe(true);
    }
  });

  it("artist constraint matches a card from card-index.json", () => {
    const card = cards.find((c) => c.name === "Battle Cry Goblin")!;
    expect(card).toBeDefined();
    expect(
      matchesConstraint(card, new GameConstraint("Test Artist", ConstraintType.Artist, "a:Test")),
    ).toBe(true);
  });

  it("artist constraint rejects card when no artist matches", () => {
    const card = cards.find((c) => c.name === "Battle Cry Goblin")!;
    expect(
      matchesConstraint(card, new GameConstraint("Mark Poole", ConstraintType.Artist, "a:Poole")),
    ).toBe(false);
  });
});

describe("Set constraint", () => {
  it("matches card from the correct set using set: prefix", () => {
    const card = makeCard({ sets: ["lrw"] });
    expect(
      matchesConstraint(card, new GameConstraint("Lorwyn", ConstraintType.Set, "set:lrw")),
    ).toBe(true);
  });

  it("does not match card from a different set", () => {
    const card = makeCard({ sets: ["m20"] });
    expect(
      matchesConstraint(card, new GameConstraint("Lorwyn", ConstraintType.Set, "set:lrw")),
    ).toBe(false);
  });

  it("matches when any printing set satisfies constraint", () => {
    const card = makeCard({ sets: ["m20", "lrw"] });
    expect(
      matchesConstraint(card, new GameConstraint("Lorwyn", ConstraintType.Set, "set:lrw")),
    ).toBe(true);
  });
});

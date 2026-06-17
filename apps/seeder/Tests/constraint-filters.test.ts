import { describe, it, expect } from "vitest";
import { type LocalCard } from "@griddening/shared";
import {
  colorConstraints,
  rarityConstraints,
  cardTypeConstraints,
  manaValueConstraints,
  powerConstraints,
  toughnessConstraints,
  artistConstraints,
  creatureRulesTextConstraints,
  creatureRaceConstraints,
  creatureJobConstraints,
  nonLandNonArtifact,
  colorless,
} from "../constants/constraintTypes.js";

function makeCard(overrides: Partial<LocalCard> = {}): LocalCard {
  return {
    name: "Test Card",
    faceNames: [],
    type_line: "Creature — Human Warrior",
    colors: ["W"],
    cmc: 2,
    rarities: ["common"],
    oracle_text: "",
    power: "2",
    toughness: "2",
    artists: ["Test Artist"],
    sets: ["m21"],
    set: "m21",
    set_name: "",
    set_type: "",
    released_at: undefined,
    imagePng: "",
    ...overrides,
  };
}

describe("color constraint local filters", () => {
  const black = colorConstraints.find((c) => c.displayName === "Black")!;
  const red = colorConstraints.find((c) => c.displayName === "Red")!;
  const green = colorConstraints.find((c) => c.displayName === "Green")!;
  const blue = colorConstraints.find((c) => c.displayName === "Blue")!;
  const white = colorConstraints.find((c) => c.displayName === "White")!;

  it("all color constraints have localFilter defined", () => {
    expect(black.localFilter).toBeDefined();
    expect(red.localFilter).toBeDefined();
    expect(green.localFilter).toBeDefined();
    expect(blue.localFilter).toBeDefined();
    expect(white.localFilter).toBeDefined();
  });

  it("black filter matches mono-black cards", () => {
    expect(black.localFilter!(makeCard({ colors: ["B"] }))).toBe(true);
  });

  it("black filter matches multicolor cards containing black", () => {
    expect(black.localFilter!(makeCard({ colors: ["B", "U"] }))).toBe(true);
  });

  it("black filter rejects non-black cards", () => {
    expect(black.localFilter!(makeCard({ colors: ["U"] }))).toBe(false);
    expect(black.localFilter!(makeCard({ colors: [] }))).toBe(false);
  });

  it("red filter matches red cards", () => {
    expect(red.localFilter!(makeCard({ colors: ["R"] }))).toBe(true);
    expect(red.localFilter!(makeCard({ colors: ["W"] }))).toBe(false);
  });

  it("green filter matches green cards", () => {
    expect(green.localFilter!(makeCard({ colors: ["G"] }))).toBe(true);
    expect(green.localFilter!(makeCard({ colors: ["R"] }))).toBe(false);
  });

  it("blue filter matches blue cards", () => {
    expect(blue.localFilter!(makeCard({ colors: ["U"] }))).toBe(true);
    expect(blue.localFilter!(makeCard({ colors: ["B"] }))).toBe(false);
  });

  it("white filter matches white cards", () => {
    expect(white.localFilter!(makeCard({ colors: ["W"] }))).toBe(true);
    expect(white.localFilter!(makeCard({ colors: ["G"] }))).toBe(false);
  });
});

describe("rarity constraint local filters", () => {
  const mythic = rarityConstraints.find((c) => c.displayName === "Mythic")!;
  const rare = rarityConstraints.find((c) => c.displayName === "Rare")!;
  const uncommon = rarityConstraints.find((c) => c.displayName === "Uncommon")!;
  const common = rarityConstraints.find((c) => c.displayName === "Common")!;

  it("all rarity constraints have localFilter defined", () => {
    expect(mythic.localFilter).toBeDefined();
    expect(rare.localFilter).toBeDefined();
    expect(uncommon.localFilter).toBeDefined();
    expect(common.localFilter).toBeDefined();
  });

  it("mythic matches mythic rarity cards", () => {
    expect(mythic.localFilter!(makeCard({ rarities: ["mythic"] }))).toBe(true);
    expect(mythic.localFilter!(makeCard({ rarities: ["rare"] }))).toBe(false);
  });

  it("rare matches rare rarity cards", () => {
    expect(rare.localFilter!(makeCard({ rarities: ["rare"] }))).toBe(true);
    expect(rare.localFilter!(makeCard({ rarities: ["common"] }))).toBe(false);
  });

  it("uncommon matches uncommon rarity cards", () => {
    expect(uncommon.localFilter!(makeCard({ rarities: ["uncommon"] }))).toBe(true);
    expect(uncommon.localFilter!(makeCard({ rarities: ["rare"] }))).toBe(false);
  });

  it("common matches common rarity cards", () => {
    expect(common.localFilter!(makeCard({ rarities: ["common"] }))).toBe(true);
    expect(common.localFilter!(makeCard({ rarities: ["uncommon"] }))).toBe(false);
  });
});

describe("card type constraint local filters", () => {
  const sorcery = cardTypeConstraints.find((c) => c.displayName === "Sorcery")!;
  const instant = cardTypeConstraints.find((c) => c.displayName === "Instant")!;
  const legendary = cardTypeConstraints.find((c) => c.displayName === "Legendary")!;
  const land = cardTypeConstraints.find((c) => c.displayName === "Land")!;
  const enchantment = cardTypeConstraints.find((c) => c.displayName === "Enchantment")!;

  it("all card type constraints have localFilter defined", () => {
    for (const constraint of cardTypeConstraints) {
      expect(constraint.localFilter, `${constraint.displayName} missing localFilter`).toBeDefined();
    }
  });

  it("sorcery matches Sorcery type line", () => {
    expect(sorcery.localFilter!(makeCard({ type_line: "Sorcery" }))).toBe(true);
    expect(sorcery.localFilter!(makeCard({ type_line: "Creature — Human" }))).toBe(false);
  });

  it("instant matches Instant type line", () => {
    expect(instant.localFilter!(makeCard({ type_line: "Instant" }))).toBe(true);
    expect(instant.localFilter!(makeCard({ type_line: "Sorcery" }))).toBe(false);
  });

  it("legendary matches Legendary in type line", () => {
    expect(legendary.localFilter!(makeCard({ type_line: "Legendary Creature — Dragon" }))).toBe(
      true,
    );
    expect(legendary.localFilter!(makeCard({ type_line: "Creature — Dragon" }))).toBe(false);
  });

  it("land matches Land type", () => {
    expect(land.localFilter!(makeCard({ type_line: "Basic Land — Forest" }))).toBe(true);
    expect(land.localFilter!(makeCard({ type_line: "Creature" }))).toBe(false);
  });

  it("enchantment matches Enchantment type", () => {
    expect(enchantment.localFilter!(makeCard({ type_line: "Enchantment — Aura" }))).toBe(true);
    expect(enchantment.localFilter!(makeCard({ type_line: "Artifact" }))).toBe(false);
  });
});

describe("mana value constraint local filters", () => {
  const cmc0 = manaValueConstraints.find((c) => c.displayName === "Mana Value 0")!;
  const cmc3 = manaValueConstraints.find((c) => c.displayName === "Mana Value 3")!;
  const cmc8 = manaValueConstraints.find((c) => c.displayName === "Mana Value 8")!;

  it("all mana value constraints have localFilter defined", () => {
    for (const constraint of manaValueConstraints) {
      expect(constraint.localFilter, `${constraint.displayName} missing localFilter`).toBeDefined();
    }
  });

  it("cmc:0 matches zero-cost cards", () => {
    expect(cmc0.localFilter!(makeCard({ cmc: 0 }))).toBe(true);
    expect(cmc0.localFilter!(makeCard({ cmc: 1 }))).toBe(false);
  });

  it("cmc:3 matches three-cost cards", () => {
    expect(cmc3.localFilter!(makeCard({ cmc: 3 }))).toBe(true);
    expect(cmc3.localFilter!(makeCard({ cmc: 4 }))).toBe(false);
  });

  it("cmc:8 matches eight-cost cards", () => {
    expect(cmc8.localFilter!(makeCard({ cmc: 8 }))).toBe(true);
    expect(cmc8.localFilter!(makeCard({ cmc: 7 }))).toBe(false);
  });
});

describe("power constraint local filters", () => {
  const pow0 = powerConstraints.find((c) => c.displayName === "Power 0")!;
  const pow5 = powerConstraints.find((c) => c.displayName === "Power 5")!;

  it("all power constraints have localFilter defined", () => {
    for (const constraint of powerConstraints) {
      expect(constraint.localFilter, `${constraint.displayName} missing localFilter`).toBeDefined();
    }
  });

  it("pow:0 matches creatures with power 0", () => {
    expect(pow0.localFilter!(makeCard({ power: "0" }))).toBe(true);
    expect(pow0.localFilter!(makeCard({ power: "1" }))).toBe(false);
    expect(pow0.localFilter!(makeCard({ power: undefined }))).toBe(false);
  });

  it("pow:5 matches creatures with power 5", () => {
    expect(pow5.localFilter!(makeCard({ power: "5" }))).toBe(true);
    expect(pow5.localFilter!(makeCard({ power: "4" }))).toBe(false);
    expect(pow5.localFilter!(makeCard({ power: undefined }))).toBe(false);
  });
});

describe("toughness constraint local filters", () => {
  const tou1 = toughnessConstraints.find((c) => c.displayName === "Toughness 1")!;
  const tou4 = toughnessConstraints.find((c) => c.displayName === "Toughness 4")!;

  it("all toughness constraints have localFilter defined", () => {
    for (const constraint of toughnessConstraints) {
      expect(constraint.localFilter, `${constraint.displayName} missing localFilter`).toBeDefined();
    }
  });

  it("tou:1 matches creatures with toughness 1", () => {
    expect(tou1.localFilter!(makeCard({ toughness: "1" }))).toBe(true);
    expect(tou1.localFilter!(makeCard({ toughness: "2" }))).toBe(false);
    expect(tou1.localFilter!(makeCard({ toughness: undefined }))).toBe(false);
  });

  it("tou:4 matches creatures with toughness 4", () => {
    expect(tou4.localFilter!(makeCard({ toughness: "4" }))).toBe(true);
    expect(tou4.localFilter!(makeCard({ toughness: "5" }))).toBe(false);
  });
});

describe("artist constraint local filters", () => {
  const guay = artistConstraints.find((c) => c.displayName === "Rebecca Guay")!;
  const avon = artistConstraints.find((c) => c.displayName === "John Avon")!;
  const walker = artistConstraints.find((c) => c.displayName === "Kev Walker")!;

  it("all artist constraints have localFilter defined", () => {
    for (const constraint of artistConstraints) {
      expect(constraint.localFilter, `${constraint.displayName} missing localFilter`).toBeDefined();
    }
  });

  it("Rebecca Guay filter matches Guay case-insensitively", () => {
    expect(guay.localFilter!(makeCard({ artists: ["Rebecca Guay"] }))).toBe(true);
    expect(guay.localFilter!(makeCard({ artists: ["REBECCA GUAY"] }))).toBe(true);
    expect(guay.localFilter!(makeCard({ artists: ["John Avon"] }))).toBe(false);
  });

  it("John Avon filter matches Avon", () => {
    expect(avon.localFilter!(makeCard({ artists: ["John Avon"] }))).toBe(true);
    expect(avon.localFilter!(makeCard({ artists: ["Rebecca Guay"] }))).toBe(false);
  });

  it("Kev Walker filter matches Walker", () => {
    expect(walker.localFilter!(makeCard({ artists: ["Kev Walker"] }))).toBe(true);
    expect(walker.localFilter!(makeCard({ artists: ["Rebecca Guay"] }))).toBe(false);
  });
});

describe("creature rules text constraint local filters", () => {
  const flying = creatureRulesTextConstraints.find((c) => c.displayName === "Flying")!;
  const trample = creatureRulesTextConstraints.find((c) => c.displayName === "Trample")!;
  const doubleStrike = creatureRulesTextConstraints.find((c) => c.displayName === "Double Strike")!;
  const firstStrike = creatureRulesTextConstraints.find((c) => c.displayName === "First Strike")!;
  const etbTapped = creatureRulesTextConstraints.find(
    (c) => c.displayName === "Enters the Battlefield Tapped",
  )!;
  const cantBlock = creatureRulesTextConstraints.find((c) => c.displayName === "Can't Block")!;
  const attacksEachCombat = creatureRulesTextConstraints.find(
    (c) => c.displayName === "Attacks Each Combat",
  )!;

  it("all creature rules text constraints have localFilter defined", () => {
    for (const constraint of creatureRulesTextConstraints) {
      expect(constraint.localFilter, `${constraint.displayName} missing localFilter`).toBeDefined();
    }
  });

  it("flying matches cards with Flying in oracle text", () => {
    expect(
      flying.localFilter!(makeCard({ oracle_text: "Flying\nWhenever this creature attacks..." })),
    ).toBe(true);
    expect(flying.localFilter!(makeCard({ oracle_text: "Trample" }))).toBe(false);
  });

  it("flying is case-insensitive", () => {
    expect(flying.localFilter!(makeCard({ oracle_text: "FLYING" }))).toBe(true);
  });

  it("trample matches cards with Trample in oracle text", () => {
    expect(trample.localFilter!(makeCard({ oracle_text: "Trample" }))).toBe(true);
    expect(trample.localFilter!(makeCard({ oracle_text: "Flying" }))).toBe(false);
  });

  it("double strike matches cards with Double Strike in oracle text", () => {
    expect(doubleStrike.localFilter!(makeCard({ oracle_text: "Double Strike" }))).toBe(true);
    expect(doubleStrike.localFilter!(makeCard({ oracle_text: "First Strike" }))).toBe(false);
  });

  it("first strike matches cards with First Strike in oracle text", () => {
    expect(firstStrike.localFilter!(makeCard({ oracle_text: "First Strike" }))).toBe(true);
    expect(firstStrike.localFilter!(makeCard({ oracle_text: "Double Strike" }))).toBe(false);
  });

  it("enters the battlefield tapped matches cards with that text in oracle text", () => {
    expect(
      etbTapped.localFilter!(
        makeCard({ oracle_text: "Goblin Guide enters the battlefield tapped." }),
      ),
    ).toBe(true);
    expect(etbTapped.localFilter!(makeCard({ oracle_text: "Flying" }))).toBe(false);
  });

  it("can't block matches cards with that text in oracle text", () => {
    expect(cantBlock.localFilter!(makeCard({ oracle_text: "This creature can't block." }))).toBe(
      true,
    );
    expect(cantBlock.localFilter!(makeCard({ oracle_text: "Flying" }))).toBe(false);
  });

  it("attacks each combat matches cards with that text in oracle text", () => {
    expect(
      attacksEachCombat.localFilter!(
        makeCard({ oracle_text: "This creature attacks each combat if able." }),
      ),
    ).toBe(true);
    expect(attacksEachCombat.localFilter!(makeCard({ oracle_text: "Flying" }))).toBe(false);
  });
});

describe("creature race type constraint local filters", () => {
  const goblin = creatureRaceConstraints.find((c) => c.displayName === "Goblin")!;
  const dragon = creatureRaceConstraints.find((c) => c.displayName === "Dragon")!;
  const elf = creatureRaceConstraints.find((c) => c.displayName === "Elf")!;

  it("all creature race constraints have localFilter defined", () => {
    for (const constraint of creatureRaceConstraints) {
      expect(constraint.localFilter, `${constraint.displayName} missing localFilter`).toBeDefined();
    }
  });

  it("goblin matches Goblin subtype", () => {
    expect(goblin.localFilter!(makeCard({ type_line: "Creature — Goblin Warrior" }))).toBe(true);
    expect(goblin.localFilter!(makeCard({ type_line: "Creature — Human Warrior" }))).toBe(false);
  });

  it("dragon matches Dragon subtype", () => {
    expect(dragon.localFilter!(makeCard({ type_line: "Creature — Dragon" }))).toBe(true);
    expect(dragon.localFilter!(makeCard({ type_line: "Creature — Goblin" }))).toBe(false);
  });

  it("elf matches Elf subtype", () => {
    expect(elf.localFilter!(makeCard({ type_line: "Creature — Elf Druid" }))).toBe(true);
    expect(elf.localFilter!(makeCard({ type_line: "Creature — Human Druid" }))).toBe(false);
  });
});

describe("creature job type constraint local filters", () => {
  const warrior = creatureJobConstraints.find((c) => c.displayName === "Warrior")!;
  const wizard = creatureJobConstraints.find((c) => c.displayName === "Wizard")!;

  it("all creature job constraints have localFilter defined", () => {
    for (const constraint of creatureJobConstraints) {
      expect(constraint.localFilter, `${constraint.displayName} missing localFilter`).toBeDefined();
    }
  });

  it("warrior matches Warrior subtype", () => {
    expect(warrior.localFilter!(makeCard({ type_line: "Creature — Human Warrior" }))).toBe(true);
    expect(warrior.localFilter!(makeCard({ type_line: "Creature — Human Wizard" }))).toBe(false);
  });

  it("wizard matches Wizard subtype", () => {
    expect(wizard.localFilter!(makeCard({ type_line: "Creature — Human Wizard" }))).toBe(true);
    expect(wizard.localFilter!(makeCard({ type_line: "Creature — Human Warrior" }))).toBe(false);
  });
});

describe("colorless constraint local filter", () => {
  it("has localFilter defined", () => {
    expect(colorless.localFilter).toBeDefined();
  });

  it("matches cards with no colors", () => {
    expect(colorless.localFilter!(makeCard({ colors: [] }))).toBe(true);
  });

  it("rejects colored cards", () => {
    expect(colorless.localFilter!(makeCard({ colors: ["B"] }))).toBe(false);
    expect(colorless.localFilter!(makeCard({ colors: ["W", "U"] }))).toBe(false);
  });
});

describe("nonLandNonArtifact constraint local filter", () => {
  it("has localFilter defined", () => {
    expect(nonLandNonArtifact.localFilter).toBeDefined();
  });

  it("matches non-land non-artifact cards", () => {
    expect(nonLandNonArtifact.localFilter!(makeCard({ type_line: "Creature — Human" }))).toBe(true);
    expect(nonLandNonArtifact.localFilter!(makeCard({ type_line: "Sorcery" }))).toBe(true);
    expect(nonLandNonArtifact.localFilter!(makeCard({ type_line: "Enchantment" }))).toBe(true);
  });

  it("rejects land cards", () => {
    expect(nonLandNonArtifact.localFilter!(makeCard({ type_line: "Basic Land — Forest" }))).toBe(
      false,
    );
    expect(nonLandNonArtifact.localFilter!(makeCard({ type_line: "Land" }))).toBe(false);
  });

  it("rejects artifact cards", () => {
    expect(nonLandNonArtifact.localFilter!(makeCard({ type_line: "Artifact" }))).toBe(false);
    expect(
      nonLandNonArtifact.localFilter!(makeCard({ type_line: "Artifact Creature — Golem" })),
    ).toBe(false);
  });
});

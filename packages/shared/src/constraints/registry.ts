import { type LocalCard } from "../types/local-card";
import { GameConstraint, ConstraintType } from "../types/game-constraint";

// Canonical, named constraint definitions — the single source of truth shared by the seeder
// (grid generation, via localFilter) and the web app (guess validation / debug endpoint).
// Set constraints are intentionally absent: they are generated per-game from real set codes,
// not from a fixed named list.

const cardTypes = [
  "Sorcery",
  "Instant",
  "Enchantment",
  "Artifact",
  "Planeswalker",
  "Land",
  "Legendary",
];

const artifactTypes = ["Equipment"];

const enchantmentTypes = ["Aura"];

const creatureRaceTypes = [
  "Goblin",
  "Elf",
  "Merfolk",
  "Zombie",
  "Human",
  "Beast",
  "Elemental",
  "Spirit",
  "Dragon",
  "Angel",
  "Hydra",
  "Demon",
  "Sphinx",
  "Treefolk",
  "Vampire",
  "Dinosaur",
  "Sliver",
  "Cat",
  "Phyrexian",
  "Eldrazi",
  "Horror",
  "Faerie",
  "Werewolf",
  "Wall",
  "Rat",
  "Insect",
  "Bear",
  "Spider",
  "God",
  "Bird",
];

const creatureJobTypes = [
  "Cleric",
  "Soldier",
  "Warrior",
  "Wizard",
  "Rogue",
  "Druid",
  "Ranger",
  "Knight",
  "Pirate",
  "Ninja",
  "Shaman",
];

export function makeTypeFilter(typeName: string): (card: LocalCard) => boolean {
  return (card) => card.type_line.includes(typeName);
}

export function makeArtistFilter(keyword: string): (card: LocalCard) => boolean {
  const lower = keyword.toLowerCase();
  return (card) => card.artists.some((a) => a.toLowerCase().includes(lower));
}

export function makeOracleFilter(keyword: string): (card: LocalCard) => boolean {
  const lower = keyword.toLowerCase();
  return (card) => card.oracle_text.toLowerCase().includes(lower);
}

export const cardTypeConstraints: GameConstraint[] = cardTypes.map((cardType) => {
  const constraint = new GameConstraint(cardType, ConstraintType.Type, `t:${cardType}`);
  constraint.localFilter = makeTypeFilter(cardType);
  return constraint;
});

export const creatureRaceConstraints: GameConstraint[] = creatureRaceTypes.map((cardType) => {
  const constraint = new GameConstraint(cardType, ConstraintType.CreatureRaceTypes, `t:${cardType}`);
  constraint.localFilter = makeTypeFilter(cardType);
  return constraint;
});

export const creatureJobConstraints: GameConstraint[] = creatureJobTypes.map((cardType) => {
  const constraint = new GameConstraint(cardType, ConstraintType.CreatureJobTypes, `t:${cardType}`);
  constraint.localFilter = makeTypeFilter(cardType);
  return constraint;
});

export const artifactSubtypesConstraints: GameConstraint[] = artifactTypes.map((cardType) => {
  const constraint = new GameConstraint(cardType, ConstraintType.ArtifactSubtypes, `t:${cardType}`);
  constraint.localFilter = makeTypeFilter(cardType);
  return constraint;
});

export const enchantmentSubtypeTypeConstraints: GameConstraint[] = enchantmentTypes.map(
  (cardType) => {
    const constraint = new GameConstraint(
      cardType,
      ConstraintType.EnchantmentSubtypes,
      `t:${cardType}`,
    );
    constraint.localFilter = makeTypeFilter(cardType);
    return constraint;
  },
);

const rarityMap: Record<string, string> = {
  Mythic: "mythic",
  Rare: "rare",
  Uncommon: "uncommon",
  Common: "common",
};

export const rarityConstraints: GameConstraint[] = [
  new GameConstraint("Mythic", ConstraintType.Rarity, "r:m"),
  new GameConstraint("Rare", ConstraintType.Rarity, "r:r"),
  new GameConstraint("Uncommon", ConstraintType.Rarity, "r:u"),
  new GameConstraint("Common", ConstraintType.Rarity, "r:c"),
].map((c) => {
  const rarityValue = rarityMap[c.displayName];
  c.localFilter = (card) => card.rarities.includes(rarityValue);
  return c;
});

export const creatureRulesTextConstraints: GameConstraint[] = (() => {
  const entries: [string, string, (card: LocalCard) => boolean][] = [
    [
      "Enters the Battlefield Tapped",
      'o:"~ enters the battlefield tapped"',
      makeOracleFilter("enters the battlefield tapped"),
    ],
    ["Trample", "o:Trample", makeOracleFilter("trample")],
    ["Flying", "o:Flying", makeOracleFilter("flying")],
    ["Vigilance", "o:Vigilance", makeOracleFilter("vigilance")],
    ["Deathtouch", "o:Deathtouch", makeOracleFilter("deathtouch")],
    ["Haste", "o:Haste", makeOracleFilter("haste")],
    ["Hexproof", "o:Hexproof", makeOracleFilter("hexproof")],
    ["Defender", "o:Defender", makeOracleFilter("defender")],
    ["Double Strike", 'o:"Double Strike"', makeOracleFilter("double strike")],
    ["First Strike", 'o:"First Strike"', makeOracleFilter("first strike")],
    ["Flash", "o:Flash", makeOracleFilter("flash")],
    ["Indestructible", "o:Indestructible", makeOracleFilter("indestructible")],
    ["Lifelink", "o:Lifelink", makeOracleFilter("lifelink")],
    ["Menace", "o:Menace", makeOracleFilter("menace")],
    ["Reach", "o:Reach", makeOracleFilter("reach")],
    ["Ward", "o:Ward", makeOracleFilter("ward")],
    ["Can't Block", 'o:"~ can\'t block"', makeOracleFilter("can't block")],
    [
      "Attacks Each Combat",
      'o:"~ attacks each combat if able"',
      makeOracleFilter("attacks each combat if able"),
    ],
  ];

  return entries.map(([displayName, scryfallQuery, localFilter]) => {
    const constraint = new GameConstraint(displayName, ConstraintType.CreatureRulesText, scryfallQuery);
    constraint.localFilter = localFilter;
    return constraint;
  });
})();

export const artistConstraints: GameConstraint[] = [
  ["Rebecca Guay", "Guay"],
  ["John Avon", "Avon"],
  ["Magali Villeneuve", "Villeneuve"],
  ["Alayna Danner", "Danner"],
  ["Kev Walker", "Walker"],
  ["Sam Burley", "Burley"],
  ["Mark Poole", "Poole"],
  ["Chris Rahn", "Rahn"],
  ["Nils Hamm", "Hamm"],
  ["Johannes Voss", "Voss"],
  ["Thomas Baxa", "Baxa"],
  ["Wayne Reynolds", "Reynolds"],
  ["Randy Vargas", "Vargas"],
  ["Livia Prima", "Prima"],
  ["Volkan Baga", "Baga"],
].map(([displayName, keyword]) => {
  const constraint = new GameConstraint(displayName, ConstraintType.Artist, `a:${keyword}`);
  constraint.localFilter = makeArtistFilter(keyword);
  return constraint;
});

export const colorConstraints: GameConstraint[] = [
  {
    displayName: "Black",
    query: "c:B",
    color: "B",
    imageSrc: "/swamp.png",
    imageAltText: "A black mana symbol; a poorly drawn skull sillouhete on a dark gray field.",
  },
  {
    displayName: "Red",
    query: "c:R",
    color: "R",
    imageSrc: "/mountain.png",
    imageAltText: "A red mana symbol; a poorly drawn fireball sillouhete on a red field.",
  },
  {
    displayName: "Green",
    query: "c:G",
    color: "G",
    imageSrc: "/forest.png",
    imageAltText: "A green mana symbol; a poorly drawn tree sillouhete on a green field.",
  },
  {
    displayName: "Blue",
    query: "c:U",
    color: "U",
    imageSrc: "/island.png",
    imageAltText: "A blue mana symbol; a poorly drawn water droplet sillouhete on a blue field.",
  },
  {
    displayName: "White",
    query: "c:W",
    color: "W",
    imageSrc: "/plains.png",
    imageAltText: "A white mana symbol; a poorly drawn sun sillouhete on a pale yellow field.",
  },
].map(({ displayName, query, color, imageSrc, imageAltText }) => {
  const constraint = new GameConstraint(displayName, ConstraintType.Color, query, imageSrc, imageAltText);
  constraint.localFilter = (card) => card.colors.includes(color);
  return constraint;
});

export const manaValueConstraints: GameConstraint[] = Array.from({ length: 9 }, (_, index) => {
  const constraint = new GameConstraint(`Mana Value ${index}`, ConstraintType.ManaValue, `cmc:${index}`);
  constraint.localFilter = (card) => card.cmc === index;
  return constraint;
});

export const toughnessConstraints: GameConstraint[] = Array.from({ length: 10 }, (_, index) => {
  const value = index + 1;
  const constraint = new GameConstraint(`Toughness ${value}`, ConstraintType.Toughness, `tou:${value}`);
  constraint.localFilter = (card) => card.toughness === String(value);
  return constraint;
});

export const powerConstraints: GameConstraint[] = Array.from({ length: 11 }, (_, index) => {
  const constraint = new GameConstraint(`Power ${index}`, ConstraintType.Power, `pow:${index}`);
  constraint.localFilter = (card) => card.power === String(index);
  return constraint;
});

export const nonLandNonArtifact: GameConstraint = (() => {
  const constraint = new GameConstraint(
    "Non-Land Non-Artifact",
    ConstraintType.Type,
    "-t:land -t:artifact",
  );
  constraint.localFilter = (card) =>
    !card.type_line.includes("Land") && !card.type_line.includes("Artifact");
  return constraint;
})();

export const colorless: GameConstraint = (() => {
  const constraint = new GameConstraint(
    "Colorless",
    ConstraintType.Color,
    "c:C -c:W -c:U -c:B -c:R -c:G",
  );
  constraint.localFilter = (card) => card.colors.length === 0;
  return constraint;
})();

// The full named universe, deduplicated by display name for lookup.
export const allConstraints: GameConstraint[] = [
  ...cardTypeConstraints,
  ...creatureRaceConstraints,
  ...creatureJobConstraints,
  ...artifactSubtypesConstraints,
  ...enchantmentSubtypeTypeConstraints,
  ...rarityConstraints,
  ...colorConstraints,
  ...manaValueConstraints,
  ...powerConstraints,
  ...toughnessConstraints,
  ...artistConstraints,
  ...creatureRulesTextConstraints,
  nonLandNonArtifact,
  colorless,
];

const byDisplayName = new Map<string, GameConstraint>(
  allConstraints.map((c) => [c.displayName.toLowerCase(), c]),
);

export function findConstraintByName(name: string): GameConstraint | undefined {
  return byDisplayName.get(name.trim().toLowerCase());
}

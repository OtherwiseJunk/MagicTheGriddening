import { GameConstraint, ConstraintType } from "../types/GameConstraint.js";

const cardTypes = [
  // Card Types
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

export const cardTypeConstraints: GameConstraint[] = cardTypes.map(
  (cardType) =>
    new GameConstraint(cardType, ConstraintType.Type, `t:${cardType}`),
);

export const creatureRaceConstraints: GameConstraint[] = creatureRaceTypes.map(
  (cardType) =>
    new GameConstraint(
      cardType,
      ConstraintType.CreatureRaceTypes,
      `t:${cardType}`,
    ),
);

export const creatureJobConstraints: GameConstraint[] = creatureJobTypes.map(
  (cardType) =>
    new GameConstraint(
      cardType,
      ConstraintType.CreatureJobTypes,
      `t:${cardType}`,
    ),
);

export const artifactSubtypesConstraints: GameConstraint[] = artifactTypes.map(
  (cardType) =>
    new GameConstraint(
      cardType,
      ConstraintType.ArtifactSubtypes,
      `t:${cardType}`,
    ),
);

export const enchantmentSubtypeTypeConstraints: GameConstraint[] =
  enchantmentTypes.map(
    (cardType) =>
      new GameConstraint(
        cardType,
        ConstraintType.EnchantmentSubtypes,
        `t:${cardType}`,
      ),
  );

export const rarityConstraints: GameConstraint[] = [
  new GameConstraint("Mythic", ConstraintType.Rarity, "r:m"),
  new GameConstraint("Rare", ConstraintType.Rarity, "r:r"),
  new GameConstraint("Uncommon", ConstraintType.Rarity, "r:u"),
  new GameConstraint("Common", ConstraintType.Rarity, "r:c"),
];

export const creatureRulesTextConstraints: GameConstraint[] = [
  new GameConstraint(
    "Enters the Battlefield Tapped",
    ConstraintType.CreatureRulesText,
    'o:"~ enters the battlefield tapped"',
  ),
  new GameConstraint("Trample", ConstraintType.CreatureRulesText, "o:Trample"),
  new GameConstraint("Flying", ConstraintType.CreatureRulesText, "o:Flying"),
  new GameConstraint(
    "Vigilance",
    ConstraintType.CreatureRulesText,
    "o:Vigilance",
  ),
  new GameConstraint(
    "Deathtouch",
    ConstraintType.CreatureRulesText,
    "o:Deathtouch",
  ),
  new GameConstraint("Haste", ConstraintType.CreatureRulesText, "o:Haste"),
  new GameConstraint(
    "Hexproof",
    ConstraintType.CreatureRulesText,
    "o:Hexproof",
  ),
  new GameConstraint(
    "Defender",
    ConstraintType.CreatureRulesText,
    "o:Defender",
  ),
  new GameConstraint(
    "Double Strike",
    ConstraintType.CreatureRulesText,
    'o:"Double Strike"',
  ),
  new GameConstraint(
    "First Strike",
    ConstraintType.CreatureRulesText,
    'o:"First Strike"',
  ),
  new GameConstraint("Flash", ConstraintType.CreatureRulesText, "o:Flash"),
  new GameConstraint(
    "Indestructible",
    ConstraintType.CreatureRulesText,
    "o:Indestructible",
  ),
  new GameConstraint(
    "Lifelink",
    ConstraintType.CreatureRulesText,
    "o:Lifelink",
  ),
  new GameConstraint("Menace", ConstraintType.CreatureRulesText, "o:Menace"),
  new GameConstraint("Reach", ConstraintType.CreatureRulesText, "o:Reach"),
  new GameConstraint("Ward", ConstraintType.CreatureRulesText, "o:Ward"),
  new GameConstraint(
    "Can't Block",
    ConstraintType.CreatureRulesText,
    'o:"~ can\'t block"',
  ),
  new GameConstraint(
    "Attacks Each Combat",
    ConstraintType.CreatureRulesText,
    'o:"~ attacks each combat if able"',
  ),
];

export const artistConstraints: GameConstraint[] = [
  new GameConstraint("Rebecca Guay", ConstraintType.Artist, `a:Guay`),
  new GameConstraint("John Avon", ConstraintType.Artist, `a:Avon`),
  new GameConstraint(
    "Magali Villeneuve",
    ConstraintType.Artist,
    "a:Villeneuve",
  ),
  new GameConstraint("Alayna Danner", ConstraintType.Artist, "a:Danner"),
  new GameConstraint("Kev Walker", ConstraintType.Artist, "a:Walker"),
  new GameConstraint("Sam Burley", ConstraintType.Artist, "a:Burley"),
  new GameConstraint("Mark Poole", ConstraintType.Artist, "a:Poole"),
  new GameConstraint("Chris Rahn", ConstraintType.Artist, "a:Rahn"),
  new GameConstraint("Nils Hamm", ConstraintType.Artist, "a:Hamm"),
  new GameConstraint("Johannes Voss", ConstraintType.Artist, "a:Voss"),
  new GameConstraint("Thomas Baxa", ConstraintType.Artist, "a:Baxa"),
  new GameConstraint("Wayne Reynolds", ConstraintType.Artist, "a:Reynolds"),
  new GameConstraint("Randy Vargas", ConstraintType.Artist, "a:Vargas"),
  new GameConstraint("Livia Prima", ConstraintType.Artist, "a:Prima"),
  new GameConstraint("Volkan Baga", ConstraintType.Artist, "a:Baga"),
];

export const colorConstraints: GameConstraint[] = [
  new GameConstraint(
    "Black",
    ConstraintType.Color,
    "c:B",
    "/swamp.png",
    "A black mana symbol; a poorly drawn skull sillouhete on a dark gray field.",
  ),
  /* Colorless is kind of a pain right now because you can't have a Colorless-Green (etc) creature
     Probably when I go to fix this when we "Draw" a colorless constraint we'll have the other constraint be Land or Artifact?
     But that will take some finessing and I want to find a cleverer way of generating these.

    new GameConstraint(
        "Colorless",
        ConstraintType.Color,
        "colorless.png",
        "A black mana symbol; a poorly drawn skull sillouhete on a dark gray field."
    ), */
  new GameConstraint(
    "Red",
    ConstraintType.Color,
    "c:R",
    "/mountain.png",
    "A red mana symbol; a poorly drawn fireball sillouhete on a red field.",
  ),
  new GameConstraint(
    "Green",
    ConstraintType.Color,
    "c:G",
    "/forest.png",
    "A green mana symbol; a poorly drawn tree sillouhete on a green field.",
  ),
  new GameConstraint(
    "Blue",
    ConstraintType.Color,
    "c:U",
    "/island.png",
    "A blue mana symbol; a poorly drawn water droplet sillouhete on a blue field.",
  ),
  new GameConstraint(
    "White",
    ConstraintType.Color,
    "c:W",
    "/plains.png",
    "A white mana symbol; a poorly drawn sun sillouhete on a pale yellow field.",
  ),
];

export const manaValueConstraints: GameConstraint[] = Array.from(
  { length: 9 },
  (_, index) =>
    new GameConstraint(
      `Mana Value ${index}`,
      ConstraintType.ManaValue,
      `cmc:${index}`,
    ),
);

export const toughnessConstraints: GameConstraint[] = Array.from(
  { length: 10 },
  (_, index) =>
    new GameConstraint(
      `Toughness ${index + 1}`,
      ConstraintType.Toughness,
      `tou:${index + 1}`,
    ),
);

export const powerConstraints: GameConstraint[] = Array.from(
  { length: 11 },
  (_, index) =>
    new GameConstraint(`Power ${index}`, ConstraintType.Power, `pow:${index}`),
);

export const nonLandNonArtifact: GameConstraint = new GameConstraint(
  "Non-Land Non-Artifact",
  ConstraintType.Type,
  "-t:land -t:artifact",
);

export const colorless: GameConstraint = new GameConstraint(
  "Colorless",
  ConstraintType.Color,
  "c:C -c:W -c:U -c:B -c:R -c:G",
);

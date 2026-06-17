import { ConstraintType, GameConstraint, type LocalCard, type LocalSet } from "@griddening/shared";
import { Puzzle, PuzzleType } from "../types/Puzzle.js";
import { shuffleArray } from "../Utilities/map.helper.js";
import {
  colorConstraints,
  manaValueConstraints,
  rarityConstraints,
  cardTypeConstraints,
  powerConstraints,
  toughnessConstraints,
  creatureRaceConstraints,
  powerCompatibleRaceConstraints,
  toughnessCompatibleRaceConstraints,
  creatureJobConstraints,
  enchantmentSubtypeTypeConstraints,
  artifactSubtypesConstraints,
  creatureRulesTextConstraints,
  artistConstraints,
  nonLandNonArtifact,
  colorless,
} from "../constants/constraintTypes.js";

type SlotLayout = { top: string[]; side: string[] };
type CreatureSlotLayout = SlotLayout & { racePool: "power" | "toughness" | "general" };

const fourColorLayouts: SlotLayout[] = [
  { top: ["set"], side: ["type"] },
  { top: ["rarity"], side: ["manaValue"] },
  { top: ["artist"], side: ["set"] },
  { top: ["type"], side: ["rarity"] },
  { top: ["manaValue"], side: ["artist"] },
  { top: ["set"], side: ["manaValue"] },
  { top: ["set"], side: ["rarity"] },
  { top: ["manaValue"], side: ["type"] },
];

const twoColorLayouts: SlotLayout[] = [
  { top: ["set", "rarity"], side: ["type", "manaValue"] },
  { top: ["set", "rarity"], side: ["rarity", "manaValue"] },
  { top: ["set", "type"], side: ["type", "artist"] },
  { top: ["set", "rarity"], side: ["artist", "manaValue"] },
  { top: ["artist", "rarity"], side: ["type", "manaValue"] },
  { top: ["set", "artist"], side: ["type", "manaValue"] },
  { top: ["artist", "rarity"], side: ["manaValue", "type"] },
  { top: ["artist", "rarity"], side: ["manaValue", "color"] },
];

const creatureLayouts: CreatureSlotLayout[] = [
  { top: ["power"], side: ["toughness"], racePool: "power" },
  { top: ["power"], side: ["creatureRulesText"], racePool: "power" },
  { top: ["creatureRulesText"], side: ["toughness"], racePool: "toughness" },
  { top: ["rarity"], side: ["manaValue"], racePool: "general" },
];

const artistLayouts: SlotLayout[] = [
  { top: ["artist", "artist"], side: ["color", "type", "rarity"] },
  { top: ["color", "artist"], side: ["color", "type", "rarity"] },
  { top: ["manaValue", "color"], side: ["color", "type", "rarity"] },
  { top: ["artist", "artist"], side: ["manaValue", "type", "rarity"] },
  { top: ["color", "artist"], side: ["manaValue", "type", "rarity"] },
  { top: ["color", "color"], side: ["manaValue", "type", "rarity"] },
  { top: ["artist", "artist"], side: ["color", "manaValue", "rarity"] },
  { top: ["type", "artist"], side: ["color", "manaValue", "rarity"] },
  { top: ["type", "type"], side: ["color", "manaValue", "rarity"] },
];

const colorlessLayouts: SlotLayout[] = [
  { top: ["rarity", "manaValue"], side: ["artist", "set"] },
  { top: ["rarity", "manaValue"], side: ["filteredType", "set"] },
  { top: ["rarity", "manaValue"], side: ["filteredType", "artist"] },
  { top: ["rarity", "set"], side: ["filteredType", "filteredType"] },
  { top: ["manaValue", "set"], side: ["filteredType", "filteredType"] },
  { top: ["rarity", "manaValue"], side: ["set", "set"] },
  { top: ["color", "manaValue"], side: ["set", "set"] },
  { top: ["color", "set"], side: ["artist", "manaValue"] },
];

export class GriddeningService {
  constructor(
    private cards: LocalCard[] = [],
    private sets: LocalSet[] = [],
  ) {}
  minimumHits = process.env.MINIMUM_HITS ? parseInt(process.env.MINIMUM_HITS) : 10;

  generateRandomPuzzleBoard(constraintDeckByConstraintType: Map<ConstraintType, GameConstraint[]>) {
    const boardType = this.getRandomInt(5);
    console.log(`got puzzle type ${PuzzleType[boardType]}`);
    const boardSubtype = this.getRandomSubtype(boardType);
    console.log(`Got subtype: ${boardSubtype}`);

    switch (boardType) {
      case PuzzleType.CreatureFocused:
        return this.generateRandomCreatureBoard(constraintDeckByConstraintType, boardSubtype);
      case PuzzleType.FourColors:
        return this.generateRandomFourColorBoard(constraintDeckByConstraintType, boardSubtype);
      case PuzzleType.TwoColors:
        return this.generateRandomTwoColorBoard(constraintDeckByConstraintType, boardSubtype);
      case PuzzleType.Colorless:
        return this.generateRandomColorlessBoard(constraintDeckByConstraintType, boardSubtype);
      case PuzzleType.ArtistFocused:
        return this.generateRandomArtistBoard(constraintDeckByConstraintType, boardSubtype);
    }
  }

  generateRandomFourColorBoard(
    constraintDeckByConstraintType: Map<ConstraintType, GameConstraint[]>,
    fourColorBoardType: number,
  ): Puzzle {
    const [set, color, type, rarity, manaValue, artist] = this.getColorFocusedDecks(
      constraintDeckByConstraintType,
    );
    const decks = { set, color, type, rarity, manaValue, artist };
    const puzzle: Puzzle = {
      topRow: [this.drawFrom(color), this.drawFrom(color)],
      sideRow: [this.drawFrom(color), this.drawFrom(color)],
      type: PuzzleType.FourColors,
      subType: fourColorBoardType,
    };
    this.fillFromLayout(puzzle, fourColorLayouts[fourColorBoardType], decks);
    return puzzle;
  }

  generateRandomTwoColorBoard(
    constraintDeckByConstraintType: Map<ConstraintType, GameConstraint[]>,
    twoColorBoardType: number,
  ): Puzzle {
    const [set, color, type, rarity, manaValue, artist] = this.getColorFocusedDecks(
      constraintDeckByConstraintType,
    );
    const decks = { set, color, type, rarity, manaValue, artist };
    const puzzle: Puzzle = {
      topRow: [this.drawFrom(color)],
      sideRow: [this.drawFrom(color)],
      type: PuzzleType.TwoColors,
      subType: twoColorBoardType,
    };
    this.fillFromLayout(puzzle, twoColorLayouts[twoColorBoardType], decks);
    return puzzle;
  }

  generateRandomCreatureBoard(
    constraintDeckByConstraintType: Map<ConstraintType, GameConstraint[]>,
    creatureBoardType: number,
  ): Puzzle {
    const layout = creatureLayouts[creatureBoardType];
    const [, creatureJob, creatureRulesText, color, power, toughness, rarity, manaValue] =
      this.getCreatureDecks(constraintDeckByConstraintType);
    const creatureRace = this.getCreatureRacePool(layout.racePool);
    const decks = {
      creatureRace,
      creatureJob,
      creatureRulesText,
      color,
      power,
      toughness,
      rarity,
      manaValue,
    };
    const puzzle: Puzzle = {
      type: PuzzleType.CreatureFocused,
      subType: creatureBoardType,
      topRow: [this.drawFrom(creatureJob), this.drawFrom(color)],
      sideRow: [this.drawFrom(creatureRace), this.drawFrom(color)],
    };
    this.fillFromLayout(puzzle, layout, decks);
    return puzzle;
  }

  generateRandomArtistBoard(
    constraintDeckByConstraintType: Map<ConstraintType, GameConstraint[]>,
    colorBoardType: number,
  ): Puzzle {
    const [color, type, rarity, manaValue, artist] = this.getDefaultDecks(
      constraintDeckByConstraintType,
    );
    const decks = { color, type, rarity, manaValue, artist };
    const puzzle: Puzzle = {
      type: PuzzleType.ArtistFocused,
      subType: colorBoardType,
      topRow: [this.drawFrom(artist)],
      sideRow: [],
    };
    this.fillFromLayout(puzzle, artistLayouts[colorBoardType], decks);
    return puzzle;
  }

  generateRandomColorlessBoard(
    constraintDeckByConstraintType: Map<ConstraintType, GameConstraint[]>,
    colorlessBoardType: number,
  ): Puzzle {
    const [set, color, type, rarity, manaValue, artist] = this.getColorFocusedDecks(
      constraintDeckByConstraintType,
    );
    const filteredType = type.filter((constraint) =>
      ["Land", "Artifact", "Creature", "Instant", "Sorcery"].includes(constraint.displayName),
    );
    const decks = { set, color, type, rarity, manaValue, artist, filteredType };
    const puzzle: Puzzle = {
      topRow: [colorless],
      sideRow: [nonLandNonArtifact],
      type: PuzzleType.Colorless,
      subType: colorlessBoardType,
    };
    this.fillFromLayout(puzzle, colorlessLayouts[colorlessBoardType], decks);
    return puzzle;
  }

  isPioneerSet(set: LocalSet): boolean {
    if (set.released_at == undefined) return false;
    const releaseYear = parseInt(set.released_at.split("-")[0]);
    if (releaseYear > 2012) return true;
    if (set.released_at === "2012-10-05") return true;
    return false;
  }

  isCoreOrExpansionSet(set: LocalSet): boolean {
    return ["core", "expansion"].includes(set.set_type);
  }

  sanitizeName(name: string): string {
    return name
      .replace("Foreign Black Border", "")
      .replace("Limited Edition Alpha", "Alpha")
      .replace("Limited Edition Beta", "Beta")
      .replace("Unlimited Edition", "Unlimited")
      .replace("Revised Edition", "Revised")
      .replace("Fourth Edition", "4th Edition")
      .replace("Fifth Edition", "5th Edition")
      .replace("Classic Sixth Edition", "6th Edition")
      .replace("Seventh Edition", "7th Edition")
      .replace("Eighth Edition", "8th Edition")
      .replace("Ninth Edition", "9th Edition")
      .replace("Tenth Edition", "10th Edition")
      .trim();
  }

  buildSetConstraintFromLocalSet(set: LocalSet): GameConstraint {
    const constraint = new GameConstraint(
      this.sanitizeName(set.name),
      ConstraintType.Set,
      `set:${set.code}`,
    );
    const setCode = set.code;
    constraint.localFilter = (card) => card.sets.includes(setCode);
    return constraint;
  }

  getSetConstraints(): GameConstraint[] {
    return this.sets
      .filter((set) => this.isCoreOrExpansionSet(set))
      .filter((set) => this.isPioneerSet(set))
      .map((set) => this.buildSetConstraintFromLocalSet(set));
  }

  intersectionHasMinimumHits(
    gameConstraintOne: GameConstraint,
    gameConstraintTwo: GameConstraint,
  ): boolean {
    const filterOne = gameConstraintOne.localFilter;
    const filterTwo = gameConstraintTwo.localFilter;
    if (!filterOne || !filterTwo) {
      return true;
    }
    const count = this.cards.filter((card) => filterOne(card) && filterTwo(card)).length;
    return count >= this.minimumHits;
  }

  createConstraintDeck(): Map<ConstraintType, GameConstraint[]> {
    const setConstraints = shuffleArray(this.getSetConstraints());

    return new Map<ConstraintType, GameConstraint[]>([
      [ConstraintType.Set, setConstraints],
      [ConstraintType.Color, shuffleArray(colorConstraints)],
      [ConstraintType.ManaValue, shuffleArray(manaValueConstraints)],
      [ConstraintType.Rarity, shuffleArray(rarityConstraints)],
      [ConstraintType.Type, shuffleArray(cardTypeConstraints)],
      [ConstraintType.Power, shuffleArray(powerConstraints)],
      [ConstraintType.Toughness, shuffleArray(toughnessConstraints)],
      [ConstraintType.Artist, shuffleArray(artistConstraints)],
      [ConstraintType.CreatureRulesText, shuffleArray(creatureRulesTextConstraints)],
      [ConstraintType.CreatureRaceTypes, shuffleArray(creatureRaceConstraints)],
      [ConstraintType.CreatureJobTypes, shuffleArray(creatureJobConstraints)],
      [ConstraintType.EnchantmentSubtypes, shuffleArray(enchantmentSubtypeTypeConstraints)],
      [ConstraintType.ArtifactSubtypes, shuffleArray(artifactSubtypesConstraints)],
    ]);
  }

  getDateStringByOffset(dayOffset: number = 0): string {
    let now = new Date();
    now = this.addDays(now, dayOffset);
    return `${now.getFullYear()}${now
      .getMonth()
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  }

  private getCreatureRacePool(racePool: "power" | "toughness" | "general"): GameConstraint[] {
    switch (racePool) {
      case "power":
        return shuffleArray([...powerCompatibleRaceConstraints]);
      case "toughness":
        return shuffleArray([...toughnessCompatibleRaceConstraints]);
      case "general":
        return shuffleArray([...creatureRaceConstraints]);
    }
  }

  private drawFrom(deck: GameConstraint[]): GameConstraint {
    const constraint = deck.shift();
    if (!constraint) {
      throw new Error("Constraint deck is empty — not enough constraints to build puzzle");
    }
    return constraint;
  }

  private fillFromLayout(
    puzzle: Puzzle,
    layout: SlotLayout,
    decks: Record<string, GameConstraint[]>,
  ) {
    for (const key of layout.top) {
      puzzle.topRow.push(this.drawFrom(decks[key]));
    }
    for (const key of layout.side) {
      puzzle.sideRow.push(this.drawFrom(decks[key]));
    }
  }

  private getRandomSubtype(boardType: number): number {
    const subtypeCounts: Record<number, number> = {
      [PuzzleType.CreatureFocused]: creatureLayouts.length,
      [PuzzleType.FourColors]: fourColorLayouts.length,
      [PuzzleType.TwoColors]: twoColorLayouts.length,
      [PuzzleType.Colorless]: colorlessLayouts.length,
      [PuzzleType.ArtistFocused]: artistLayouts.length,
    };
    return this.getRandomInt(subtypeCounts[boardType]);
  }

  private getDefaultDecks(constraintDeckByConstraintType: Map<ConstraintType, GameConstraint[]>) {
    const colorConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.Color) as GameConstraint[],
    );
    const rarityConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.Rarity) as GameConstraint[],
    );
    const manaValueConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.ManaValue) as GameConstraint[],
    );
    const cardTypeConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.Type) as GameConstraint[],
    );
    const artistConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.Artist) as GameConstraint[],
    );

    return [
      colorConstraints,
      cardTypeConstraints,
      rarityConstraints,
      manaValueConstraints,
      artistConstraints,
    ];
  }

  private getColorFocusedDecks(
    constraintDeckByConstraintType: Map<ConstraintType, GameConstraint[]>,
  ) {
    const setConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.Set) as GameConstraint[],
    );

    return [setConstraints, ...this.getDefaultDecks(constraintDeckByConstraintType)];
  }

  private getCreatureDecks(constraintDeckByConstraintType: Map<ConstraintType, GameConstraint[]>) {
    const creatureRaceConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.CreatureRaceTypes) as GameConstraint[],
    );
    const creatureJobConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.CreatureJobTypes) as GameConstraint[],
    );
    const creatureRulesTextConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.CreatureRulesText) as GameConstraint[],
    );
    const powerConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.Power) as GameConstraint[],
    );
    const toughnessConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.Toughness) as GameConstraint[],
    );
    const colorConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.Color) as GameConstraint[],
    );
    const rarityConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.Rarity) as GameConstraint[],
    );
    const manaValueConstraints = shuffleArray(
      constraintDeckByConstraintType.get(ConstraintType.ManaValue) as GameConstraint[],
    );

    return [
      creatureRaceConstraints,
      creatureJobConstraints,
      creatureRulesTextConstraints,
      colorConstraints,
      powerConstraints,
      toughnessConstraints,
      rarityConstraints,
      manaValueConstraints,
    ];
  }

  private getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  private addDays(dateToAddTo: Date, days: number): Date {
    const date = new Date(dateToAddTo.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }
}

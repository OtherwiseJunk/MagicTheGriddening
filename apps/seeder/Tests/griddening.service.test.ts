import { expect, test, describe, beforeEach } from "vitest";
import { GriddeningService } from "../services/griddening.service.js";
import { ConstraintType, GameConstraint, type LocalCard, type LocalSet } from "@griddening/shared";
import {
  pioneerSet,
  standardSet,
  setsWithExpectedIsPioneerReturns,
  setTypesToFilter,
  namesToSanitizeWithExpectedResult,
  setsWithExpectedConstraintReturns,
  setInputs,
  expectedSetOutputs,
} from "./testUtilities/consts/griddening.testconstants.js";
import {
  colorConstraints,
  rarityConstraints,
  powerCompatibleRaceConstraints,
  toughnessCompatibleRaceConstraints,
  creatureRaceConstraints,
} from "../constants/constraintTypes.js";
import { PuzzleType } from "../types/Puzzle.js";
import { cloneMapOfDecks } from "../Utilities/map.helper.js";

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

const griddeningService = new GriddeningService([], []);

describe("Griddening Service", () => {
  describe("createConstraintDeck", () => {
    test("returns map of constraint arrays for each Constraint Type", () => {
      const service = new GriddeningService([], [pioneerSet, standardSet]);
      const mapConstraintDecks = service.createConstraintDeck();
      expect(mapConstraintDecks.size).toBe(ConstraintType.__LENGTH);
    });
  });

  describe("isPioneerSet", () => {
    test.each(setsWithExpectedIsPioneerReturns)("(%o) -> %o", (localSet, expectedResult) => {
      const isPioneerSet = griddeningService.isPioneerSet(localSet);
      expect(isPioneerSet).toBe(expectedResult);
    });
  });

  describe("isCoreOrExpansionSet", () => {
    test.each(setTypesToFilter)("(set_type === %s) -> false", (setType) => {
      const set: LocalSet = {
        code: "f",
        name: setType,
        set_type: setType,
        released_at: "1993-01-01",
      };
      expect(griddeningService.isCoreOrExpansionSet(set)).toBe(false);
    });

    test("core set returns true", () => {
      const set: LocalSet = {
        code: "m21",
        name: "Core Set 2021",
        set_type: "core",
        released_at: "2020-07-03",
      };
      expect(griddeningService.isCoreOrExpansionSet(set)).toBe(true);
    });

    test("expansion set returns true", () => {
      const set: LocalSet = {
        code: "ktk",
        name: "Khans of Tarkir",
        set_type: "expansion",
        released_at: "2014-09-26",
      };
      expect(griddeningService.isCoreOrExpansionSet(set)).toBe(true);
    });
  });

  describe("sanitizeName", () => {
    test.each(setTypesToFilter)("(setName === %s) -> unmodified set name", (setType) => {
      expect(griddeningService.sanitizeName(setType)).toBe(setType);
    });
    test.each(namesToSanitizeWithExpectedResult)(
      "(setName === %s) -> setName === %s",
      (inputSetName, outputSetName) => {
        expect(griddeningService.sanitizeName(inputSetName)).toBe(outputSetName);
      },
    );
  });

  describe("buildSetConstraintFromLocalSet", () => {
    test.each(setsWithExpectedConstraintReturns)("(%o) -> %o", (inputSet, outputConstraint) => {
      const constraint = griddeningService.buildSetConstraintFromLocalSet(inputSet);
      expect(constraint.displayName).toBe(outputConstraint.displayName);
      expect(constraint.constraintType).toBe(ConstraintType.Set);
      expect(constraint.imageAltText).toBe(outputConstraint.imageAltText);
      expect(constraint.imageSrc).toBe(outputConstraint.imageSrc);
      expect(constraint.scryfallQuery).toBe(outputConstraint.scryfallQuery);
    });

    test("produced constraint has localFilter matching set code", () => {
      const set: LocalSet = {
        code: "ktk",
        name: "Khans of Tarkir",
        set_type: "expansion",
        released_at: "2014-09-26",
      };
      const constraint = griddeningService.buildSetConstraintFromLocalSet(set);
      expect(constraint.localFilter!(makeCard({ sets: ["ktk"] }))).toBe(true);
      expect(constraint.localFilter!(makeCard({ sets: ["m21"] }))).toBe(false);
    });
  });

  describe("getSetConstraints", () => {
    test("should return qualifying pioneer set constraints", () => {
      const service = new GriddeningService([], setInputs);
      const setConstraints = service.getSetConstraints();
      expect(setConstraints.length).toBe(expectedSetOutputs.length);
    });
  });

  describe("intersectionHasMinimumHits", () => {
    const black = colorConstraints.find((c) => c.displayName === "Black")!;
    const mythic = rarityConstraints.find((c) => c.displayName === "Mythic")!;

    test("returns true when at least 10 local cards match both constraints", () => {
      const cards: LocalCard[] = Array.from({ length: 10 }, (_, i) =>
        makeCard({ colors: ["B"], rarities: ["mythic"], name: `Card ${i}` }),
      );
      const service = new GriddeningService(cards, []);
      expect(service.intersectionHasMinimumHits(black, mythic)).toBe(true);
    });

    test("returns false when fewer than 10 local cards match both constraints", () => {
      const cards: LocalCard[] = Array.from({ length: 9 }, (_, i) =>
        makeCard({ colors: ["B"], rarities: ["mythic"], name: `Card ${i}` }),
      );
      const service = new GriddeningService(cards, []);
      expect(service.intersectionHasMinimumHits(black, mythic)).toBe(false);
    });

    test("returns true when either constraint lacks a localFilter (optimistic fallback)", () => {
      const noFilterConstraint = new GameConstraint("Unknown", ConstraintType.Set, "set:xyz");
      const service = new GriddeningService([], []);
      expect(service.intersectionHasMinimumHits(noFilterConstraint, black)).toBe(true);
      expect(service.intersectionHasMinimumHits(black, noFilterConstraint)).toBe(true);
      expect(service.intersectionHasMinimumHits(noFilterConstraint, noFilterConstraint)).toBe(true);
    });

    test("respects MINIMUM_HITS environment variable", () => {
      const cards: LocalCard[] = Array.from({ length: 7 }, (_, i) =>
        makeCard({ colors: ["B"], rarities: ["mythic"], name: `Card ${i}` }),
      );
      process.env.MINIMUM_HITS = "7";
      const service = new GriddeningService(cards, []);
      expect(service.intersectionHasMinimumHits(black, mythic)).toBe(true);
      delete process.env.MINIMUM_HITS;
    });

    test("returns false when MINIMUM_HITS not reached", () => {
      const cards: LocalCard[] = Array.from({ length: 6 }, (_, i) =>
        makeCard({ colors: ["B"], rarities: ["mythic"], name: `Card ${i}` }),
      );
      process.env.MINIMUM_HITS = "7";
      const service = new GriddeningService(cards, []);
      expect(service.intersectionHasMinimumHits(black, mythic)).toBe(false);
      delete process.env.MINIMUM_HITS;
    });
  });

  describe("generateRandomCreatureBoard", () => {
    const mapOfDecks = new GriddeningService([], [pioneerSet, standardSet]).createConstraintDeck();
    let copyDeck: Map<ConstraintType, GameConstraint[]>;
    beforeEach(() => {
      copyDeck = cloneMapOfDecks(mapOfDecks);
    });

    for (let i = 0; i < 4; i++) {
      test(`Should return a puzzle with a type of CreatureFocused Puzzle for subtype ${i}`, () => {
        const puzzle = griddeningService.generateRandomCreatureBoard(copyDeck, i);
        expect(puzzle.type).toBe(PuzzleType.CreatureFocused);
      });

      test(`Should return a puzzle.subType of ${i} for subtype ${i}`, () => {
        const puzzle = griddeningService.generateRandomCreatureBoard(copyDeck, i);
        expect(puzzle.subType).toBe(i);
      });
    }

    test("Should return a top row with a Color, Power, and Creature Job constraint and a side row with a Creature Race, Toughness, and Color constraint for subtype 0", () => {
      const puzzle = griddeningService.generateRandomCreatureBoard(copyDeck, 0);
      expect(puzzle.topRow.length).toBe(3);
      expect(puzzle.sideRow.length).toBe(3);

      expect(puzzle.topRow.filter((c) => c.constraintType === ConstraintType.Color).length).toBe(1);
      expect(puzzle.topRow.filter((c) => c.constraintType === ConstraintType.Power).length).toBe(1);
      expect(
        puzzle.topRow.filter((c) => c.constraintType === ConstraintType.CreatureJobTypes).length,
      ).toBe(1);
      expect(puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.Color).length).toBe(
        1,
      );
      expect(
        puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.Toughness).length,
      ).toBe(1);
      expect(
        puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.CreatureRaceTypes).length,
      ).toBe(1);
    });

    test("Should return a top row with a Color, Power, and Creature Job constraint and a side row with a Creature Race, Creature Rules Text, and Color constraint for subtype 1", () => {
      const puzzle = griddeningService.generateRandomCreatureBoard(copyDeck, 1);
      expect(puzzle.topRow.length).toBe(3);
      expect(puzzle.sideRow.length).toBe(3);

      expect(puzzle.topRow.filter((c) => c.constraintType === ConstraintType.Color).length).toBe(1);
      expect(puzzle.topRow.filter((c) => c.constraintType === ConstraintType.Power).length).toBe(1);
      expect(
        puzzle.topRow.filter((c) => c.constraintType === ConstraintType.CreatureJobTypes).length,
      ).toBe(1);
      expect(puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.Color).length).toBe(
        1,
      );
      expect(
        puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.CreatureRulesText).length,
      ).toBe(1);
      expect(
        puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.CreatureRaceTypes).length,
      ).toBe(1);
    });

    test("Should return a top row with a Color, Power, and Creature Job constraint and a side row with a Creature Race, Toughness, and Color constraint for subtype 2", () => {
      const puzzle = griddeningService.generateRandomCreatureBoard(copyDeck, 2);
      expect(puzzle.topRow.length).toBe(3);
      expect(puzzle.sideRow.length).toBe(3);

      expect(puzzle.topRow.filter((c) => c.constraintType === ConstraintType.Color).length).toBe(1);
      expect(
        puzzle.topRow.filter((c) => c.constraintType === ConstraintType.CreatureRulesText).length,
      ).toBe(1);
      expect(
        puzzle.topRow.filter((c) => c.constraintType === ConstraintType.CreatureJobTypes).length,
      ).toBe(1);
      expect(puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.Color).length).toBe(
        1,
      );
      expect(
        puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.Toughness).length,
      ).toBe(1);
      expect(
        puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.CreatureRaceTypes).length,
      ).toBe(1);
    });

    test("Should return a top row with a Color, Rarity, and Creature Job constraint and a side row with a Creature Race, ManaValue, and Color constraint for subtype 3", () => {
      const puzzle = griddeningService.generateRandomCreatureBoard(copyDeck, 3);
      expect(puzzle.topRow.length).toBe(3);
      expect(puzzle.sideRow.length).toBe(3);

      expect(puzzle.topRow.filter((c) => c.constraintType === ConstraintType.Color).length).toBe(1);
      expect(puzzle.topRow.filter((c) => c.constraintType === ConstraintType.Rarity).length).toBe(
        1,
      );
      expect(
        puzzle.topRow.filter((c) => c.constraintType === ConstraintType.CreatureJobTypes).length,
      ).toBe(1);
      expect(puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.Color).length).toBe(
        1,
      );
      expect(
        puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.ManaValue).length,
      ).toBe(1);
      expect(
        puzzle.sideRow.filter((c) => c.constraintType === ConstraintType.CreatureRaceTypes).length,
      ).toBe(1);
    });
  });

  describe("generateRandomCreatureBoard race pool selection", () => {
    const mapOfDecks = new GriddeningService([], [pioneerSet, standardSet]).createConstraintDeck();
    const powerDisplayNames = new Set(powerCompatibleRaceConstraints.map((c) => c.displayName));
    const toughnessDisplayNames = new Set(
      toughnessCompatibleRaceConstraints.map((c) => c.displayName),
    );
    const allDisplayNames = new Set(creatureRaceConstraints.map((c) => c.displayName));

    test("subtype 0 (power/toughness) race is drawn from the power-compatible pool", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(
          cloneMapOfDecks(mapOfDecks),
          0,
        );
        const race = puzzle.sideRow.find(
          (c) => c.constraintType === ConstraintType.CreatureRaceTypes,
        )!;
        expect(powerDisplayNames.has(race.displayName)).toBe(true);
      }
    });

    test("subtype 1 (power/rulesText) race is drawn from the power-compatible pool", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(
          cloneMapOfDecks(mapOfDecks),
          1,
        );
        const race = puzzle.sideRow.find(
          (c) => c.constraintType === ConstraintType.CreatureRaceTypes,
        )!;
        expect(powerDisplayNames.has(race.displayName)).toBe(true);
      }
    });

    test("subtype 2 (rulesText/toughness) race is drawn from the toughness-compatible pool", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(
          cloneMapOfDecks(mapOfDecks),
          2,
        );
        const race = puzzle.sideRow.find(
          (c) => c.constraintType === ConstraintType.CreatureRaceTypes,
        )!;
        expect(toughnessDisplayNames.has(race.displayName)).toBe(true);
      }
    });

    test("subtype 2 (rulesText/toughness) can produce Wall", () => {
      const races = new Set<string>();
      for (let i = 0; i < 200; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(
          cloneMapOfDecks(mapOfDecks),
          2,
        );
        const race = puzzle.sideRow.find(
          (c) => c.constraintType === ConstraintType.CreatureRaceTypes,
        )!;
        races.add(race.displayName);
      }
      expect(races.has("Wall")).toBe(true);
    });

    test("subtype 3 (rarity/manaValue) race is drawn from the general pool", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(
          cloneMapOfDecks(mapOfDecks),
          3,
        );
        const race = puzzle.sideRow.find(
          (c) => c.constraintType === ConstraintType.CreatureRaceTypes,
        )!;
        expect(allDisplayNames.has(race.displayName)).toBe(true);
      }
    });

    test("power pool races never appear in subtype 0 are not Wall or Bear", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(
          cloneMapOfDecks(mapOfDecks),
          0,
        );
        const race = puzzle.sideRow.find(
          (c) => c.constraintType === ConstraintType.CreatureRaceTypes,
        )!;
        expect(race.displayName).not.toBe("Wall");
        expect(race.displayName).not.toBe("Bear");
        expect(race.displayName).not.toBe("Insect");
      }
    });
  });

  describe("empty constraint deck", () => {
    test("should throw when a skeleton deck is empty", () => {
      const emptyDecks = new Map<ConstraintType, GameConstraint[]>([
        [ConstraintType.Set, []],
        [ConstraintType.Color, []],
        [ConstraintType.ManaValue, []],
        [ConstraintType.Rarity, []],
        [ConstraintType.Type, []],
        [ConstraintType.Power, []],
        [ConstraintType.Toughness, []],
        [ConstraintType.Artist, []],
        [ConstraintType.CreatureRulesText, []],
        [ConstraintType.CreatureRaceTypes, []],
        [ConstraintType.CreatureJobTypes, []],
        [ConstraintType.EnchantmentSubtypes, []],
        [ConstraintType.ArtifactSubtypes, []],
      ]);

      expect(() => griddeningService.generateRandomCreatureBoard(emptyDecks, 0)).toThrow(
        "Constraint deck is empty",
      );

      expect(() => griddeningService.generateRandomFourColorBoard(emptyDecks, 0)).toThrow(
        "Constraint deck is empty",
      );

      expect(() => griddeningService.generateRandomTwoColorBoard(emptyDecks, 0)).toThrow(
        "Constraint deck is empty",
      );

      expect(() => griddeningService.generateRandomArtistBoard(emptyDecks, 0)).toThrow(
        "Constraint deck is empty",
      );
    });

    test("should throw when a layout deck runs out of entries", () => {
      const mapOfDecks = new GriddeningService(
        [],
        [pioneerSet, standardSet],
      ).createConstraintDeck();
      const sparseDecks = cloneMapOfDecks(mapOfDecks);
      sparseDecks.set(ConstraintType.Color, [
        new GameConstraint("Red", ConstraintType.Color, "c:R"),
      ]);

      expect(() => griddeningService.generateRandomFourColorBoard(sparseDecks, 0)).toThrow(
        "Constraint deck is empty",
      );
    });
  });

  describe("puzzle type distribution", () => {
    const distributionService = new GriddeningService([], [pioneerSet, standardSet]);
    const deckMap = distributionService.createConstraintDeck();

    function generateValidPuzzle(): ReturnType<GriddeningService["generateRandomPuzzleBoard"]> {
      let puzzle = distributionService.generateRandomPuzzleBoard(cloneMapOfDecks(deckMap));
      while (!puzzle) {
        puzzle = distributionService.generateRandomPuzzleBoard(cloneMapOfDecks(deckMap));
      }
      return puzzle;
    }

    test("generating 100 puzzles produces a balanced type distribution", () => {
      const SAMPLE_SIZE = 100;
      const TYPE_COUNT = Object.values(PuzzleType).filter((v) => typeof v === "number").length;
      const MAX_SHARE = Math.round((SAMPLE_SIZE / TYPE_COUNT) * 2);
      const MIN_APPEARANCES = 3;

      const puzzles = Array.from({ length: SAMPLE_SIZE }, () => generateValidPuzzle());

      const countsByType: Record<number, number> = {};
      for (const puzzle of puzzles) {
        countsByType[puzzle.type] = (countsByType[puzzle.type] ?? 0) + 1;
      }

      const typeNames = Object.fromEntries(
        Object.values(PuzzleType)
          .filter((v) => typeof v === "number")
          .map((v) => [v, PuzzleType[v as number]]),
      );

      for (const type of Object.values(PuzzleType).filter(
        (v) => typeof v === "number",
      ) as number[]) {
        const count = countsByType[type] ?? 0;
        expect(
          count,
          `${typeNames[type]} appeared ${count} times — expected at least ${MIN_APPEARANCES}`,
        ).toBeGreaterThanOrEqual(MIN_APPEARANCES);
        expect(
          count,
          `${typeNames[type]} appeared ${count}/${SAMPLE_SIZE} times — suspected bias (max ${MAX_SHARE})`,
        ).toBeLessThanOrEqual(MAX_SHARE);
      }
    }, 15_000);
  });

  describe("getDateStringByOffset", () => {
    test("should return today's date for offset 0", () => {
      const date = griddeningService.getDateStringByOffset(0);
      const today = new Date();
      const dateString = `${today.getFullYear()}${today
        .getMonth()
        .toString()
        .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;

      console.log(date);
      console.log(dateString);
      expect(date).toBe(dateString);
    });
  });
});

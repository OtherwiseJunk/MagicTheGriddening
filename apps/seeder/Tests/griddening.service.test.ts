import { expect, test, describe, beforeEach } from "vitest";
import { GriddeningService } from "../services/griddening.service.js";
import { ConstraintType, GameConstraint } from "../types/GameConstraint.js";
import * as Scry from "scryfall-sdk";
import { ScryfallHelper } from "./testUtilities/scryfall.helper.js";
import { ScryfallMockedService } from "../__mocks__/scryfall.service.js";
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
  powerCompatibleRaceConstraints,
  toughnessCompatibleRaceConstraints,
  creatureRaceConstraints,
} from "../constants/constraintTypes.js";
import { PuzzleType } from "../types/Puzzle.js";
import { cloneMapOfDecks } from "../Utilities/map.helper.js";

const scryfallServiceMock = new ScryfallMockedService();
const griddeningService = new GriddeningService(scryfallServiceMock);

describe("Griddening Service", () => {
  describe("createConstraintDeck", () => {
    test("returns map of constraint arrays for each Contraint Type", async () => {
      scryfallServiceMock.setAllSets([pioneerSet, standardSet]);

      const mapConstraintDecks = await griddeningService.createConstraintDeck();
      expect(mapConstraintDecks.size).toBe(ConstraintType.__LENGTH);
    });
  });

  describe("isPioneerSet", () => {
    test.each(setsWithExpectedIsPioneerReturns)("(%o) -> %o", (scrySet, expectedResult) => {
      const isPioneerSet = griddeningService.isPioneerSet(scrySet as Scry.Set);
      expect(isPioneerSet).toBe(expectedResult);
    });
  });

  describe("sanitizeSet", () => {
    test.each(setTypesToFilter)("(set.setType === %s) -> unmodified set name", (setType) => {
      const filteredScryfallSet = ScryfallHelper.generateScryfallSet(
        "1993-01-01",
        setType,
        "f",
        setType,
      );
      expect(griddeningService.sanitizeSet(filteredScryfallSet).name).toBe(
        filteredScryfallSet.name,
      );
    });
    test.each(namesToSanitizeWithExpectedResult)(
      "(set.setName === %s) -> set.setName === %s",
      (inputSetName, outputSetName) => {
        const scryfallSet = ScryfallHelper.generateScryfallSet("1993-01-01", inputSetName, "f");
        const outputSet = griddeningService.sanitizeSet(scryfallSet);

        if (outputSet == undefined) {
          expect("").toBe(outputSetName);
        } else {
          expect(outputSet!.name).toBe(outputSetName);
        }
      },
    );
  });

  describe("buildSetConstraintFromScryfallSet", () => {
    test.each(setsWithExpectedConstraintReturns)("(%o) -> %o", (inputSet, outputConstraint) => {
      const constraint = griddeningService.buildSetConstraintFromScryfallSet(inputSet as Scry.Set);
      expect(constraint.displayName).toBe((outputConstraint as GameConstraint).displayName);
      expect(constraint.constraintType).toBe(ConstraintType.Set);
      expect(constraint.imageAltText).toBe((outputConstraint as GameConstraint).imageAltText);
      expect(constraint.imageSrc).toBe((outputConstraint as GameConstraint).imageSrc);
      expect(constraint.scryfallQuery).toBe((outputConstraint as GameConstraint).scryfallQuery);
    });
  });

  describe("getSetConstraints", () => {
    test("should return qualifying pioneer set constraints", async () => {
      scryfallServiceMock.setAllSets(setInputs);

      const setConstraints = await griddeningService.getSetConstraints();

      expect(setConstraints.length).toBe(expectedSetOutputs.length);
    });
  });

  describe("intersectionHasMinimumHits", () => {
    const fakeConstraint = new GameConstraint("", ConstraintType.Set, "");

    test("returns true when intersection has 10 or more hits when no MINIMUM_HITS environment varaible is set", async () => {
      scryfallServiceMock.setHitCount(10);
      expect(
        await griddeningService.intersectionHasMinimumHits(fakeConstraint, fakeConstraint),
      ).toBeTruthy();
    });
    test("returns false when intersection has less than 10 hits when no MINIMUM_HITS environment varaible is set", async () => {
      scryfallServiceMock.setHitCount(9);
      expect(
        await griddeningService.intersectionHasMinimumHits(fakeConstraint, fakeConstraint),
      ).toBeFalsy();
    });
    test("returns true when intersection has process.env.MINIMUM_HITS or more hits", async () => {
      scryfallServiceMock.setHitCount(7);
      process.env.MINIMUM_HITS = "7";
      const service = new GriddeningService(scryfallServiceMock);
      expect(await service.intersectionHasMinimumHits(fakeConstraint, fakeConstraint)).toBeTruthy();
    });
    test("returns false when intersection has less than process.env.MINIMUM_HITS hits", async () => {
      scryfallServiceMock.setHitCount(6);
      process.env.MINIMUM_HITS = "7";
      const service = new GriddeningService(scryfallServiceMock);
      expect(await service.intersectionHasMinimumHits(fakeConstraint, fakeConstraint)).toBeFalsy();
    });
  });

  describe("generateRandomCreatureBoard", async () => {
    const mapOfDecks = await griddeningService.createConstraintDeck();
    let copyDeck: Map<ConstraintType, GameConstraint[]> = cloneMapOfDecks(mapOfDecks);
    beforeEach(() => {
      copyDeck = cloneMapOfDecks(mapOfDecks);
    });

    for (let i = 0; i < 4; i++) {
      test(`Should return a puzzle with a type of CreatureFocused Puzzle for subtype ${i}`, async () => {
        const puzzle = griddeningService.generateRandomCreatureBoard(copyDeck, i);
        expect(puzzle.type).toBe(PuzzleType.CreatureFocused);
      });

      test(`Should return a puzzle.subType of ${i} for subtype ${i}`, async () => {
        const puzzle = griddeningService.generateRandomCreatureBoard(copyDeck, i);
        expect(puzzle.subType).toBe(i);
      });
    }

    test("Should return a top row with a Color, Power, and Creature Job constraint and a side row with a Creature Race, Toughness, and Color constraint for subtype 0", async () => {
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

    test("Should return a top row with a Color, Power, and Creature Job constraint and a side row with a Creature Race, Creature Rules Text, and Color constraint for subtype 1", async () => {
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

    test("Should return a top row with a Color, Power, and Creature Job constraint and a side row with a Creature Race, Toughness, and Color constraint for subtype 2", async () => {
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

    test("Should return a top row with a Color, Rarity, and Creature Job constraint and a side row with a Creature Race, ManaValue, and Color constraint for subtype 3", async () => {
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

  describe("generateRandomCreatureBoard race pool selection", async () => {
    const mapOfDecks = await griddeningService.createConstraintDeck();
    let copyDeck: Map<ConstraintType, GameConstraint[]>;
    beforeEach(() => {
      copyDeck = cloneMapOfDecks(mapOfDecks);
    });

    const powerDisplayNames = new Set(powerCompatibleRaceConstraints.map((c) => c.displayName));
    const toughnessDisplayNames = new Set(toughnessCompatibleRaceConstraints.map((c) => c.displayName));
    const allDisplayNames = new Set(creatureRaceConstraints.map((c) => c.displayName));

    test("subtype 0 (power/toughness) race is drawn from the power-compatible pool", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(cloneMapOfDecks(mapOfDecks), 0);
        const race = puzzle.sideRow.find((c) => c.constraintType === ConstraintType.CreatureRaceTypes)!;
        expect(powerDisplayNames.has(race.displayName)).toBe(true);
      }
    });

    test("subtype 1 (power/rulesText) race is drawn from the power-compatible pool", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(cloneMapOfDecks(mapOfDecks), 1);
        const race = puzzle.sideRow.find((c) => c.constraintType === ConstraintType.CreatureRaceTypes)!;
        expect(powerDisplayNames.has(race.displayName)).toBe(true);
      }
    });

    test("subtype 2 (rulesText/toughness) race is drawn from the toughness-compatible pool", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(cloneMapOfDecks(mapOfDecks), 2);
        const race = puzzle.sideRow.find((c) => c.constraintType === ConstraintType.CreatureRaceTypes)!;
        expect(toughnessDisplayNames.has(race.displayName)).toBe(true);
      }
    });

    test("subtype 2 (rulesText/toughness) can produce Wall", () => {
      const races = new Set<string>();
      for (let i = 0; i < 200; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(cloneMapOfDecks(mapOfDecks), 2);
        const race = puzzle.sideRow.find((c) => c.constraintType === ConstraintType.CreatureRaceTypes)!;
        races.add(race.displayName);
      }
      expect(races.has("Wall")).toBe(true);
    });

    test("subtype 3 (rarity/manaValue) race is drawn from the general pool", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(cloneMapOfDecks(mapOfDecks), 3);
        const race = puzzle.sideRow.find((c) => c.constraintType === ConstraintType.CreatureRaceTypes)!;
        expect(allDisplayNames.has(race.displayName)).toBe(true);
      }
    });

    test("power pool races never appear in subtype 0 are not Wall or Bear", () => {
      for (let i = 0; i < 20; i++) {
        const puzzle = griddeningService.generateRandomCreatureBoard(cloneMapOfDecks(mapOfDecks), 0);
        const race = puzzle.sideRow.find((c) => c.constraintType === ConstraintType.CreatureRaceTypes)!;
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

    test("should throw when a layout deck runs out of entries", async () => {
      const mapOfDecks = await griddeningService.createConstraintDeck();
      const sparseDecks = cloneMapOfDecks(mapOfDecks);
      // Keep only 1 color constraint — skeleton needs 2 for FourColors
      sparseDecks.set(ConstraintType.Color, [
        new GameConstraint("Red", ConstraintType.Color, "c:R"),
      ]);

      expect(() => griddeningService.generateRandomFourColorBoard(sparseDecks, 0)).toThrow(
        "Constraint deck is empty",
      );
    });
  });

  describe("puzzle type distribution", async () => {
    // Use a fresh service with pioneer-era sets and high hit count so all
    // intersections always pass — this isolates distribution from validation bias
    const distributionMock = new ScryfallMockedService();
    distributionMock.setAllSets([pioneerSet, standardSet]);
    distributionMock.setHitCount(15); // always exceeds MINIMUM_HITS=10
    const distributionService = new GriddeningService(distributionMock);
    const deckMap = await distributionService.createConstraintDeck();

    async function generateValidPuzzle() {
      let puzzle = distributionService.generateRandomPuzzleBoard(cloneMapOfDecks(deckMap));
      while (!puzzle) {
        puzzle = distributionService.generateRandomPuzzleBoard(cloneMapOfDecks(deckMap));
      }
      // Validate all 9 intersections — always passes since hitCount=15
      for (const top of puzzle.topRow) {
        for (const side of puzzle.sideRow) {
          const valid = await distributionService.intersectionHasMinimumHits(top, side);
          if (!valid) return generateValidPuzzle();
        }
      }
      return puzzle;
    }

    test(
      "generating 100 puzzles produces a balanced type distribution",
      async () => {
        const SAMPLE_SIZE = 100;
        const TYPE_COUNT = Object.values(PuzzleType).filter((v) => typeof v === "number").length;
        // 2× expected share — scales automatically as new puzzle types are added.
        // With 5 types: max=40 (~5σ above mean). With 9 types: max=22 (~3.5σ above mean).
        // Both catch the original 70% FourColors bias while remaining stable under random variation.
        const MAX_SHARE = Math.round((SAMPLE_SIZE / TYPE_COUNT) * 2);
        const MIN_APPEARANCES = 3; // every type should appear at least 3 times in 100

        const puzzles = await Promise.all(
          Array.from({ length: SAMPLE_SIZE }, () => generateValidPuzzle()),
        );

        const countsByType: Record<number, number> = {};
        for (const puzzle of puzzles) {
          countsByType[puzzle.type] = (countsByType[puzzle.type] ?? 0) + 1;
        }

        const typeNames = Object.fromEntries(
          Object.values(PuzzleType)
            .filter((v) => typeof v === "number")
            .map((v) => [v, PuzzleType[v as number]]),
        );

        for (const type of Object.values(PuzzleType).filter((v) => typeof v === "number") as number[]) {
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
      },
      15_000,
    );
  });

  describe("getDateStringByOffset", async () => {
    test("should return today's date for offset 0", async () => {
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

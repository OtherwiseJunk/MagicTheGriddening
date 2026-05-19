import { expect, test, describe, beforeEach } from "vitest";
import { GriddeningService } from "../services/griddening.service.js";
import { ConstraintType, GameConstraint } from "../types/GameConstraint.js";
import { ScryfallMockedService } from "../__mocks__/scryfall.service.js";
import { cloneMapOfDecks } from "../Utilities/map.helper.js";
import { PuzzleType } from "../types/Puzzle.js";
import {
  pioneerSet,
  standardSet,
} from "./testUtilities/consts/griddening.testconstants.js";

const scryfallServiceMock = new ScryfallMockedService();
const griddeningService = new GriddeningService(scryfallServiceMock);

describe("Performance", () => {
  describe("constraint deck creation", () => {
    test("should create a constraint deck in under 50ms", async () => {
      scryfallServiceMock.setAllSets([pioneerSet, standardSet]);

      const start = performance.now();
      const deck = await griddeningService.createConstraintDeck();
      const elapsed = performance.now() - start;

      expect(deck.size).toBe(ConstraintType.__LENGTH);
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("board generation", () => {
    let deckMap: Map<ConstraintType, GameConstraint[]>;

    beforeEach(async () => {
      scryfallServiceMock.setAllSets([pioneerSet, standardSet]);
      deckMap = await griddeningService.createConstraintDeck();
    });

    const boardGenerators: [string, PuzzleType, number][] = [
      ["CreatureFocused", PuzzleType.CreatureFocused, 4],
      ["FourColors", PuzzleType.FourColors, 8],
      ["TwoColors", PuzzleType.TwoColors, 8],
      ["Colorless", PuzzleType.Colorless, 8],
      ["ArtistFocused", PuzzleType.ArtistFocused, 9],
    ];

    test.each(boardGenerators)(
      "%s board generation should complete all subtypes in under 10ms",
      (name, puzzleType, subtypeCount) => {
        const start = performance.now();
        for (let i = 0; i < subtypeCount; i++) {
          const deck = cloneMapOfDecks(deckMap);
          switch (puzzleType) {
            case PuzzleType.CreatureFocused:
              griddeningService.generateRandomCreatureBoard(deck, i);
              break;
            case PuzzleType.FourColors:
              griddeningService.generateRandomFourColorBoard(deck, i);
              break;
            case PuzzleType.TwoColors:
              griddeningService.generateRandomTwoColorBoard(deck, i);
              break;
            case PuzzleType.Colorless:
              griddeningService.generateRandomColorlessBoard(deck, i);
              break;
            case PuzzleType.ArtistFocused:
              griddeningService.generateRandomArtistBoard(deck, i);
              break;
          }
        }
        const elapsed = performance.now() - start;

        expect(elapsed).toBeLessThan(10);
      },
    );

    test("generating 100 random boards should complete in under 100ms", () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        const deck = cloneMapOfDecks(deckMap);
        griddeningService.generateRandomPuzzleBoard(deck);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });

  describe("intersection validation", () => {
    const fakeConstraint = new GameConstraint("", ConstraintType.Set, "");

    test("100 intersection checks should complete in under 50ms with cached results", async () => {
      scryfallServiceMock.setHitCount(10);

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        await griddeningService.intersectionHasMinimumHits(
          fakeConstraint,
          fakeConstraint,
        );
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("full puzzle generation cycle", () => {
    let deckMap: Map<ConstraintType, GameConstraint[]>;

    beforeEach(async () => {
      scryfallServiceMock.setAllSets([pioneerSet, standardSet]);
      deckMap = await griddeningService.createConstraintDeck();
    });

    test("generating and validating 5 puzzles should complete in under 200ms", async () => {
      scryfallServiceMock.setHitCount(10);

      const start = performance.now();
      for (let i = 0; i < 5; i++) {
        const deck = cloneMapOfDecks(deckMap);
        const puzzle = griddeningService.generateRandomPuzzleBoard(deck);
        if (puzzle) {
          for (const top of puzzle.topRow) {
            for (const side of puzzle.sideRow) {
              await griddeningService.intersectionHasMinimumHits(top, side);
            }
          }
        }
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(200);
    });

    test("rerolling until valid should not take excessive attempts", async () => {
      scryfallServiceMock.setHitCount(10);

      let rerolls = 0;
      const maxAttempts = 50;
      let puzzle = griddeningService.generateRandomPuzzleBoard(
        cloneMapOfDecks(deckMap),
      );

      while (!puzzle && rerolls < maxAttempts) {
        puzzle = griddeningService.generateRandomPuzzleBoard(
          cloneMapOfDecks(deckMap),
        );
        rerolls++;
      }

      expect(puzzle).toBeDefined();
      expect(rerolls).toBeLessThan(maxAttempts);
    });
  });

  describe("cloneMapOfDecks", () => {
    let deckMap: Map<ConstraintType, GameConstraint[]>;

    beforeEach(async () => {
      scryfallServiceMock.setAllSets([pioneerSet, standardSet]);
      deckMap = await griddeningService.createConstraintDeck();
    });

    test("cloning deck map 1000 times should complete in under 100ms", () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        cloneMapOfDecks(deckMap);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});

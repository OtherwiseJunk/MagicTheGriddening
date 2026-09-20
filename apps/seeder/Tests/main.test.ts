import { expect, test, describe } from "vitest";
import {
  calculateOffsetFromToday,
  calculateStartingDayOffset,
  classifyPuzzleAttempt,
} from "../main.js";
import { GameConstraint, ConstraintType } from "@griddening/shared";
import { Puzzle, PuzzleType } from "../types/Puzzle.js";
import { computePuzzleSignature } from "../services/puzzle-signature.js";

function constraint(displayName: string): GameConstraint {
  return new GameConstraint(displayName, ConstraintType.Color, `query:${displayName}`);
}

function samplePuzzle(): Puzzle {
  return {
    type: PuzzleType.FourColors,
    subType: 0,
    topRow: [constraint("A"), constraint("B"), constraint("C")],
    sideRow: [constraint("D"), constraint("E"), constraint("F")],
  };
}

describe("Main", () => {
  describe("calculateOffsetFromToday", () => {
    test("should return 0 if date passed in is today", async () => {
      expect(calculateOffsetFromToday(new Date())).toBe(0);
    });
    test("should return 1 if date passed in is one day past today", async () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      expect(calculateOffsetFromToday(date)).toBe(1);
    });
    test("should return -1 if date passed in is one day before today", async () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      expect(calculateOffsetFromToday(date)).toBe(-1);
    });
  });

  describe("calculateStartingDayOffset", () => {
    test("returns -1 when no games exist so first puzzle is today", () => {
      expect(calculateStartingDayOffset(undefined)).toBe(-1);
    });
    test("returns offset of newest game when games exist", () => {
      const date = new Date();
      date.setDate(date.getDate() + 3);
      expect(calculateStartingDayOffset(date)).toBe(3);
    });
  });

  describe("classifyPuzzleAttempt", () => {
    test("returns 'invalid' when intersections are not valid, regardless of history", () => {
      const puzzle = samplePuzzle();
      const recentSignatures = new Set<string>();
      expect(classifyPuzzleAttempt(puzzle, false, recentSignatures)).toBe("invalid");
    });

    test("returns 'duplicate' when intersections are valid but the signature was already used", () => {
      const puzzle = samplePuzzle();
      const recentSignatures = new Set([computePuzzleSignature(puzzle)]);
      expect(classifyPuzzleAttempt(puzzle, true, recentSignatures)).toBe("duplicate");
    });

    test("returns 'valid' when intersections are valid and the signature is unused", () => {
      const puzzle = samplePuzzle();
      const recentSignatures = new Set<string>();
      expect(classifyPuzzleAttempt(puzzle, true, recentSignatures)).toBe("valid");
    });
  });
});

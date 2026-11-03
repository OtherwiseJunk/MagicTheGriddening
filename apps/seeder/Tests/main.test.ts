import { expect, test, describe } from "vitest";
import { calculateOffsetFromToday, findMissingOffsets } from "../main.js";
import { classifyPuzzleAttempt } from "../services/puzzle-generation.js";
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

  describe("calculateOffsetFromToday across DST", () => {
    // Runs under whatever TZ the machine has; the assertions hold in any zone.
    test("counts calendar days over the fall-back boundary at the cron time", () => {
      const now = new Date(2026, 9, 29, 0, 30);
      expect(calculateOffsetFromToday(new Date(2026, 10, 2), now)).toBe(4);
      expect(calculateOffsetFromToday(new Date(2026, 10, 3), now)).toBe(5);
    });
    test("counts calendar days over the spring-forward boundary at the cron time", () => {
      const now = new Date(2026, 2, 5, 0, 30);
      expect(calculateOffsetFromToday(new Date(2026, 2, 9), now)).toBe(4);
      expect(calculateOffsetFromToday(new Date(2026, 2, 10), now)).toBe(5);
    });
    test("is independent of time of day", () => {
      const date = new Date(2026, 10, 8);
      expect(calculateOffsetFromToday(date, new Date(2026, 10, 3, 0, 0))).toBe(5);
      expect(calculateOffsetFromToday(date, new Date(2026, 10, 3, 23, 59))).toBe(5);
    });
  });

  describe("findMissingOffsets", () => {
    const now = new Date(2026, 10, 3, 0, 30);

    test("returns every offset 0..buffer when nothing exists", () => {
      expect(findMissingOffsets(new Set(), 5, now)).toEqual([0, 1, 2, 3, 4, 5]);
    });
    test("returns nothing when the whole window is filled", () => {
      const all = new Set(["20261103", "20261104", "20261105", "20261106", "20261107", "20261108"]);
      expect(findMissingOffsets(all, 5, now)).toEqual([]);
    });
    test("finds gaps in the middle of the window (the 11/03 and 11/05 incident)", () => {
      const existing = new Set(["20261104", "20261106", "20261107", "20261108"]);
      expect(findMissingOffsets(existing, 5, now)).toEqual([0, 2]);
    });
    test("finds a missing tail when the buffer is short", () => {
      const existing = new Set(["20261103", "20261104", "20261105"]);
      expect(findMissingOffsets(existing, 5, now)).toEqual([3, 4, 5]);
    });
    test("ignores dates outside the window", () => {
      const existing = new Set(["20261101", "20261103", "20261120"]);
      expect(findMissingOffsets(existing, 2, now)).toEqual([1, 2]);
    });
    test("walks across a month boundary and DST change", () => {
      const start = new Date(2026, 9, 30, 0, 30);
      expect(findMissingOffsets(new Set(["20261101"]), 3, start)).toEqual([0, 1, 3]);
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

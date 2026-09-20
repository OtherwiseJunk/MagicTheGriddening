import { describe, it, expect } from "vitest";
import { GameConstraint, ConstraintType } from "@griddening/shared";
import { Puzzle, PuzzleType } from "../types/Puzzle.js";
import {
  computePuzzleSignature,
  computeSignatureFromStoredConstraints,
} from "../services/puzzle-signature.js";

function constraint(displayName: string, constraintType = ConstraintType.Color): GameConstraint {
  return new GameConstraint(displayName, constraintType, `query:${displayName}`);
}

function puzzle(topRow: GameConstraint[], sideRow: GameConstraint[]): Puzzle {
  return { type: PuzzleType.FourColors, subType: 0, topRow, sideRow };
}

describe("computePuzzleSignature", () => {
  it("is identical when topRow and sideRow are swapped (transposed grid is the same puzzle)", () => {
    const a = puzzle(
      [constraint("A"), constraint("B"), constraint("C")],
      [constraint("D"), constraint("E"), constraint("F")],
    );
    const b = puzzle(
      [constraint("D"), constraint("E"), constraint("F")],
      [constraint("A"), constraint("B"), constraint("C")],
    );
    expect(computePuzzleSignature(a)).toBe(computePuzzleSignature(b));
  });

  it("is identical regardless of order within a row", () => {
    const a = puzzle(
      [constraint("A"), constraint("B"), constraint("C")],
      [constraint("D"), constraint("E"), constraint("F")],
    );
    const b = puzzle(
      [constraint("C"), constraint("A"), constraint("B")],
      [constraint("F"), constraint("D"), constraint("E")],
    );
    expect(computePuzzleSignature(a)).toBe(computePuzzleSignature(b));
  });

  it("differs for puzzles with different constraints", () => {
    const a = puzzle(
      [constraint("A"), constraint("B"), constraint("C")],
      [constraint("D"), constraint("E"), constraint("F")],
    );
    const b = puzzle(
      [constraint("A"), constraint("B"), constraint("C")],
      [constraint("D"), constraint("E"), constraint("Z")],
    );
    expect(computePuzzleSignature(a)).not.toBe(computePuzzleSignature(b));
  });

  it("differs when the same displayName appears under a different constraintType", () => {
    const a = puzzle(
      [constraint("A", ConstraintType.Color), constraint("B"), constraint("C")],
      [constraint("D"), constraint("E"), constraint("F")],
    );
    const b = puzzle(
      [constraint("A", ConstraintType.Artist), constraint("B"), constraint("C")],
      [constraint("D"), constraint("E"), constraint("F")],
    );
    expect(computePuzzleSignature(a)).not.toBe(computePuzzleSignature(b));
  });
});

describe("computeSignatureFromStoredConstraints", () => {
  it("matches computePuzzleSignature for the same 6 constraints in the same grouping", () => {
    const topRow = [constraint("A"), constraint("B"), constraint("C")];
    const sideRow = [constraint("D"), constraint("E"), constraint("F")];
    const stored = [...topRow, ...sideRow];
    expect(computeSignatureFromStoredConstraints(stored)).toBe(
      computePuzzleSignature(puzzle(topRow, sideRow)),
    );
  });
});

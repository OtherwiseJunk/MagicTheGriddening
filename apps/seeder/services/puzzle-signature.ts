import { GameConstraint } from "@griddening/shared";
import { Puzzle } from "../types/Puzzle.js";

function constraintKey(constraint: GameConstraint): string {
  return `${constraint.constraintType}:${constraint.displayName}`;
}

// Two puzzles are the "same puzzle" to a player if they show the same 6 constraints split into
// the same two groups of 3, regardless of which group is drawn as rows vs columns (main.ts
// randomly swaps topRow/sideRow after validation) or the display order within a group (also
// shuffled). So the signature sorts each group internally, then orders the two groups against
// each other, making it invariant to both swaps.
function signatureFromGroups(groupA: GameConstraint[], groupB: GameConstraint[]): string {
  const sortedA = groupA.map(constraintKey).sort().join(",");
  const sortedB = groupB.map(constraintKey).sort().join(",");
  return sortedA <= sortedB ? `${sortedA}|${sortedB}` : `${sortedB}|${sortedA}`;
}

export function computePuzzleSignature(puzzle: Puzzle): string {
  return signatureFromGroups(puzzle.topRow, puzzle.sideRow);
}

// Reconstructs the signature from a flat array as stored in Game.constraintsJSON
// ([...topRow, ...sideRow]). Every puzzle type produces exactly 3 top + 3 side slots, so the
// first-3/last-3 split always recovers the original two groups.
export function computeSignatureFromStoredConstraints(constraints: GameConstraint[]): string {
  return signatureFromGroups(constraints.slice(0, 3), constraints.slice(3, 6));
}

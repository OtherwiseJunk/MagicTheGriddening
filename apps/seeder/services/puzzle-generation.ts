import { cloneMapOfDecks, shuffleArray } from "../Utilities/map.helper.js";
import { GriddeningService } from "./griddening.service.js";
import { Puzzle, PuzzleType } from "../types/Puzzle.js";
import { ConstraintType, GameConstraint } from "@griddening/shared";
import { computePuzzleSignature } from "./puzzle-signature.js";

const puzzleGenerationTimeoutMs = 600_000;
// 5 years (including a leap year)
export const puzzleUniquenessWindowDays = process.env.PUZZLE_UNIQUENESS_WINDOW_DAYS
  ? parseInt(process.env.PUZZLE_UNIQUENESS_WINDOW_DAYS)
  : 1826;

export type PuzzleAttemptOutcome = "valid" | "duplicate" | "invalid";

export function classifyPuzzleAttempt(
  puzzle: Puzzle,
  intersectionsValid: boolean,
  recentSignatures: Set<string>,
): PuzzleAttemptOutcome {
  if (!intersectionsValid) return "invalid";
  if (recentSignatures.has(computePuzzleSignature(puzzle))) return "duplicate";
  return "valid";
}

export function logPuzzle(puzzle: Puzzle) {
  console.log(`Generated puzzle of type ${puzzle?.type} with subtype ${puzzle?.subType}`);
  console.log("\r\nTop Row:");
  console.log(`${puzzle?.topRow[0].displayName}`);
  console.log(`${puzzle?.topRow[1].displayName}`);
  console.log(`${puzzle?.topRow[2].displayName}\r\n`);
  console.log("Side Row:");
  console.log(`${puzzle?.sideRow[0].displayName}`);
  console.log(`${puzzle?.sideRow[1].displayName}`);
  console.log(`${puzzle?.sideRow[2].displayName}\r\n`);
}

export class PuzzleGenerator {
  constructor(private griddening: GriddeningService) {}

  async generateValidPuzzleWithTimeout(
    deckMap: Map<ConstraintType, GameConstraint[]>,
    recentSignatures: Set<string>,
  ): Promise<Puzzle> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error(`Puzzle generation exceeded ${puzzleGenerationTimeoutMs}ms`)),
        puzzleGenerationTimeoutMs,
      );
    });
    try {
      return await Promise.race([this.generateValidPuzzle(deckMap, recentSignatures), timeout]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  private async generateValidPuzzle(
    deckMap: Map<ConstraintType, GameConstraint[]>,
    recentSignatures: Set<string>,
  ): Promise<Puzzle> {
    const griddening = this.griddening;
    let puzzle = griddening.generateRandomPuzzleBoard(cloneMapOfDecks(deckMap));
    while (puzzle == undefined) {
      console.log("Generated puzzle undefined :-( rolling new type.");
      puzzle = griddening.generateRandomPuzzleBoard(cloneMapOfDecks(deckMap));
    }
    let rerollCount = 0;
    let isValid = false;
    const start = Date.now();
    while (!isValid) {
      const topRow = puzzle.topRow as GameConstraint[];
      const sideRow = puzzle.sideRow as GameConstraint[];
      const intersectionsValid = this.intersectionsAreValid(sideRow, topRow);
      const outcome = classifyPuzzleAttempt(puzzle, intersectionsValid, recentSignatures);

      if (outcome === "valid") {
        isValid = true;
        console.log("Puzzle is valid!");
        const timeTaken = Date.now() - start;
        console.log(`Total time taken to generate valid puzzle: ${timeTaken / 1000} seconds`);
        console.log(`Number of rerolls: ${rerollCount}`);
        rerollCount = 0;
      } else if (outcome === "duplicate") {
        rerollCount++;
        console.log("Puzzle exactly matches one already used — rolling new type.");
        puzzle = griddening.generateRandomPuzzleBoard(cloneMapOfDecks(deckMap))!;
      } else {
        rerollCount++;
        if (rerollCount % 1000 === 0) {
          // Yield to macrotask queue so setTimeout-based timers (cron, timeout
          // wrapper) can fire even during cache-hot reroll storms.
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          console.log(`${rerollCount} rerolls, trying fresh board type...`);
          puzzle = griddening.generateRandomPuzzleBoard(cloneMapOfDecks(deckMap))!;
        } else {
          puzzle = this.rerollPuzzle(cloneMapOfDecks(deckMap), puzzle!);
        }
      }
    }
    puzzle.topRow = shuffleArray<GameConstraint>(puzzle.topRow);
    puzzle.sideRow = shuffleArray<GameConstraint>(puzzle.sideRow);

    if (Math.floor(Math.random() * 2) === 1) {
      const temp = puzzle.topRow;
      puzzle.topRow = puzzle.sideRow;
      puzzle.sideRow = temp;
    }

    return puzzle;
  }

  private intersectionsAreValid(sideRow: GameConstraint[], topRow: GameConstraint[]) {
    for (const top of topRow) {
      for (const side of sideRow) {
        if (!this.griddening.intersectionHasMinimumHits(top, side)) {
          return false;
        }
      }
    }
    return true;
  }

  private rerollPuzzle(deckMap: Map<ConstraintType, GameConstraint[]>, puzzle: Puzzle): Puzzle {
    const griddening = this.griddening;
    switch (puzzle!.type) {
      case PuzzleType.ArtistFocused:
        return griddening.generateRandomArtistBoard(cloneMapOfDecks(deckMap), puzzle!.subType!);
      case PuzzleType.Colorless:
        return griddening.generateRandomColorlessBoard(cloneMapOfDecks(deckMap), puzzle!.subType!);
      case PuzzleType.TwoColors:
        return griddening.generateRandomTwoColorBoard(cloneMapOfDecks(deckMap), puzzle!.subType!);
      case PuzzleType.CreatureFocused:
        return griddening.generateRandomCreatureBoard(cloneMapOfDecks(deckMap), puzzle!.subType!);
      case PuzzleType.FourColors:
        return griddening.generateRandomFourColorBoard(cloneMapOfDecks(deckMap), puzzle!.subType!);
    }
  }
}

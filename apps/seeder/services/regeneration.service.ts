import { Puzzle } from "../types/Puzzle.js";
import { DataService } from "./data.service.js";
import { computePuzzleSignature } from "./puzzle-signature.js";

export interface RegenerationOptions {
  dataService: Pick<DataService, "getGamesAfter" | "getRecentPuzzleSignatures" | "replaceGames">;
  generatePuzzle: (recentSignatures: Set<string>) => Promise<Puzzle>;
  // YYYYMMDD. Games on this date or earlier are never touched.
  today: string;
  windowDays: number;
  dryRun?: boolean;
}

export interface RegenerationResult {
  dates: string[];
  deleted: number;
  regenerated: number;
}

// Replaces every game dated after `today` with a freshly generated one on the same date.
// Generation happens before anything is deleted, and the swap is a single transaction, so a
// failure leaves the existing puzzles in place.
export async function regenerateFuturePuzzles({
  dataService,
  generatePuzzle,
  today,
  windowDays,
  dryRun = false,
}: RegenerationOptions): Promise<RegenerationResult> {
  const games = await dataService.getGamesAfter(today);
  const dates = games.map((game) => game.dateString);

  const played = games.filter(
    (game) => game._count.playerRecords > 0 || game._count.correctGuesses > 0,
  );
  if (played.length > 0) {
    throw new Error(
      `Refusing to regenerate: games with play data exist for ${played
        .map((game) => game.dateString)
        .join(", ")}`,
    );
  }

  if (dryRun || games.length === 0) {
    return { dates, deleted: 0, regenerated: 0 };
  }

  const signatures = await dataService.getRecentPuzzleSignatures(windowDays, new Set(dates));
  const newGames: { dateString: string; constraintsJSON: string }[] = [];
  for (const dateString of dates) {
    const puzzle = await generatePuzzle(signatures);
    signatures.add(computePuzzleSignature(puzzle));
    newGames.push({
      dateString,
      constraintsJSON: JSON.stringify([...puzzle.topRow, ...puzzle.sideRow]),
    });
  }

  await dataService.replaceGames(
    games.map((game) => game.id),
    newGames,
  );
  return { dates, deleted: games.length, regenerated: newGames.length };
}

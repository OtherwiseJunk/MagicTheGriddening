import { cloneMapOfDecks, shuffleArray } from "./Utilities/map.helper.js";
import { GriddeningService } from "./services/griddening.service.js";
import { ScryfallService } from "./services/scryfall.service.js";
import * as Scry from "scryfall-sdk";
import { Puzzle, PuzzleType } from "./types/Puzzle.js";
import { ConstraintType, GameConstraint } from "./types/GameConstraint.js";
import { DataService } from "./services/data.service.js";
import { PrismaClient } from "@prisma/client";
import schedule from "node-schedule";

const prisma = new PrismaClient();
const scryfall = new ScryfallService(Scry);
const griddening = new GriddeningService(scryfall);
const dataService = new DataService(prisma);
const puzzleBuffer = 5;
const puzzleGenerationTimeoutMs = 600_000;

async function start() {
  const date = await dataService.getDateOfNewestGame();

  if (date == undefined) {
    console.log("No games found in DB, starting from scratch.");
    await generatePuzzles(puzzleBuffer, 0);
    return;
  }

  const offset = calculateOffsetFromToday(date);
  console.log(`Offset from today: ${offset}`);

  if (offset < 0) {
    console.log("No puzzle for today — generating today + buffer.");
    await generatePuzzles(puzzleBuffer, 0);
    return;
  }

  const puzzlesToCreate = puzzleBuffer - offset;
  if (puzzlesToCreate > 0) {
    console.log(`Creating ${puzzlesToCreate} puzzles`);
    await generatePuzzles(puzzlesToCreate, offset);
  }
}

async function generatePuzzles(puzzleCount: number, dayOffset: number) {
  console.log("Starting...");
  const deckMap = await griddening.createConstraintDeck();

  for (let i = 1; i < puzzleCount + 1; i++) {
    console.log(`Generating ${i + 1} puzzle...`);
    const puzzle = await generateValidPuzzleWithTimeout(deckMap);
    logPuzzle(puzzle);
    const dateStringFromOffset = griddening.getDateStringByOffset(
      dayOffset + i,
    );
    console.log(`Creating game in DB for ${dateStringFromOffset}`);
    await dataService.createNewGame(
      griddening.getDateStringByOffset(dayOffset + i),
      [...puzzle.topRow, ...puzzle.sideRow],
    );
    console.log("\r\n\r\n");
  }
  console.log("Generation complete. Awaiting next cron trigger.");
}

async function generateValidPuzzleWithTimeout(
  deckMap: Map<ConstraintType, GameConstraint[]>,
): Promise<Puzzle> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () =>
        reject(
          new Error(
            `Puzzle generation exceeded ${puzzleGenerationTimeoutMs}ms`,
          ),
        ),
      puzzleGenerationTimeoutMs,
    );
  });
  try {
    return await Promise.race([generateValidPuzzle(deckMap), timeout]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

async function generateValidPuzzle(
  deckMap: Map<ConstraintType, GameConstraint[]>,
): Promise<Puzzle> {
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
    const intersectionsValid = await intersectionsAreValid(sideRow, topRow);

    if (intersectionsValid) {
      isValid = true;
      console.log("Puzzle is valid!");
      const timeTaken = Date.now() - start;
      console.log(
        `Total time taken to generate valid puzzle: ${timeTaken / 1000} seconds`,
      );
      console.log(`Number of rerolls: ${rerollCount}`);
      rerollCount = 0;
    } else {
      rerollCount++;
      if (rerollCount % 1000 === 0) {
        // Yield to macrotask queue so setTimeout-based timers (cron, timeout
        // wrapper) can fire even during cache-hot reroll storms.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        console.log(`${rerollCount} rerolls, trying fresh board type...`);
        puzzle = griddening.generateRandomPuzzleBoard(
          cloneMapOfDecks(deckMap),
        )!;
      } else {
        puzzle = rerollPuzzle(cloneMapOfDecks(deckMap), puzzle!);
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

async function intersectionsAreValid(
  sideRow: GameConstraint[],
  topRow: GameConstraint[],
) {
  for (const top of topRow) {
    for (const side of sideRow) {
      if (!(await griddening.intersectionHasMinimumHits(top, side))) {
        return false;
      }
    }
  }
  return true;
}

function rerollPuzzle(
  deckMap: Map<ConstraintType, GameConstraint[]>,
  puzzle: Puzzle,
): Puzzle {
  switch (puzzle!.type) {
    case PuzzleType.ArtistFocused:
      return griddening.generateRandomArtistBoard(
        cloneMapOfDecks(deckMap),
        puzzle!.subType!,
      );
    case PuzzleType.Colorless:
      return griddening.generateRandomColorlessBoard(
        cloneMapOfDecks(deckMap),
        puzzle!.subType!,
      );
    case PuzzleType.TwoColors:
      return griddening.generateRandomTwoColorBoard(
        cloneMapOfDecks(deckMap),
        puzzle!.subType!,
      );
    case PuzzleType.CreatureFocused:
      return griddening.generateRandomCreatureBoard(
        cloneMapOfDecks(deckMap),
        puzzle!.subType!,
      );
    case PuzzleType.FourColors:
      return griddening.generateRandomFourColorBoard(
        cloneMapOfDecks(deckMap),
        puzzle!.subType!,
      );
  }
}
function logPuzzle(puzzle: Puzzle) {
  console.log(
    `Generated puzzle of type ${puzzle?.type} with subtype ${puzzle?.subType}`,
  );
  console.log("\r\nTop Row:");
  console.log(`${puzzle?.topRow[0].displayName}`);
  console.log(`${puzzle?.topRow[1].displayName}`);
  console.log(`${puzzle?.topRow[2].displayName}\r\n`);
  console.log("Side Row:");
  console.log(`${puzzle?.sideRow[0].displayName}`);
  console.log(`${puzzle?.sideRow[1].displayName}`);
  console.log(`${puzzle?.sideRow[2].displayName}\r\n`);
}

export function calculateOffsetFromToday(date: Date) {
  const now = new Date();
  const difference = Math.ceil(
    Math.round(date.getTime() - now.getTime()) / (1000 * 3600 * 24),
  );
  return difference;
}

if (!process.env.VITEST) {
  if (process.env.RUN_ONCE) {
    console.log("Running single generation (RUN_ONCE mode).");
    start()
      .then(() => {
        console.log("Generation complete, exiting.");
        process.exit(0);
      })
      .catch((err) => {
        console.error("Generation failed:", err);
        process.exit(1);
      });
  } else {
    const cronSchedule = process.env.CRON_SCHEDULE ?? "30 00 * * *";
    schedule.scheduleJob(cronSchedule, async () => {
      console.log("firing job");
      try {
        await start();
      } catch (err) {
        console.error("Scheduled run failed:", err);
      }
    });

    console.log(`Scheduled job with cron '${cronSchedule}'.`);
    console.log("Current time: " + new Date().toLocaleString("en-US"));
    console.log("Running initial generation now.");
    start().catch((err) => console.error("Initial run failed:", err));
  }
}

import { GriddeningService } from "./services/griddening.service.js";
import { CardDataService } from "./services/card-data.service.js";
import { DataService } from "./services/data.service.js";
import { computePuzzleSignature } from "./services/puzzle-signature.js";
import {
  PuzzleGenerator,
  logPuzzle,
  puzzleUniquenessWindowDays,
} from "./services/puzzle-generation.js";
import { PrismaClient } from "@prisma/client";
import schedule from "node-schedule";

const prisma = new PrismaClient();
const cardDataService = new CardDataService();
const dataService = new DataService(prisma);

let griddening: GriddeningService;
let puzzleGenerator: PuzzleGenerator;

async function initGriddening() {
  const [cards, sets] = await Promise.all([cardDataService.getCards(), cardDataService.getSets()]);
  console.log(`Card database loaded: ${cards.length} cards, ${sets.length} sets`);
  griddening = new GriddeningService(cards, sets);
  puzzleGenerator = new PuzzleGenerator(griddening);
}
const puzzleBuffer = process.env.PUZZLE_BUFFER ? parseInt(process.env.PUZZLE_BUFFER) : 5;

async function start() {
  await initGriddening();
  const date = await dataService.getDateOfNewestGame();

  if (date == undefined) {
    console.log("No games found in DB, starting from scratch.");
    await generatePuzzles(puzzleBuffer, calculateStartingDayOffset(date));
    return;
  }

  const offset = calculateOffsetFromToday(date);
  console.log(`Offset from today: ${offset}`);

  if (offset < 0) {
    console.log("No puzzle for today — generating today + buffer.");
    await generatePuzzles(puzzleBuffer, -1);
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
  const deckMap = griddening.createConstraintDeck();
  const recentSignatures = await dataService.getRecentPuzzleSignatures(puzzleUniquenessWindowDays);
  console.log(
    `Loaded ${recentSignatures.size} puzzle signature(s) from the last ${puzzleUniquenessWindowDays} days.`,
  );

  for (let i = 1; i < puzzleCount + 1; i++) {
    console.log(`Generating ${i + 1} puzzle...`);
    const puzzle = await puzzleGenerator.generateValidPuzzleWithTimeout(deckMap, recentSignatures);
    recentSignatures.add(computePuzzleSignature(puzzle));
    logPuzzle(puzzle);
    const dateStringFromOffset = griddening.getDateStringByOffset(dayOffset + i);
    console.log(`Creating game in DB for ${dateStringFromOffset}`);
    await dataService.createNewGame(griddening.getDateStringByOffset(dayOffset + i), [
      ...puzzle.topRow,
      ...puzzle.sideRow,
    ]);
    console.log("\r\n\r\n");
  }
  console.log("Generation complete. Awaiting next cron trigger.");
}

export function calculateOffsetFromToday(date: Date) {
  const now = new Date();
  const difference = Math.ceil(Math.round(date.getTime() - now.getTime()) / (1000 * 3600 * 24));
  return difference || 0;
}

export function calculateStartingDayOffset(newestGameDate: Date | undefined): number {
  if (newestGameDate === undefined) return -1;
  return calculateOffsetFromToday(newestGameDate);
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

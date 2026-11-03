import { GriddeningService } from "./services/griddening.service.js";
import { CardDataService } from "./services/card-data.service.js";
import { toDateString } from "@griddening/shared";
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
  const upcoming = await dataService.getDateStringsFrom(griddening.getDateStringByOffset(0));
  const missing = findMissingOffsets(upcoming, puzzleBuffer);

  if (missing.length === 0) {
    console.log("No missing puzzles in the buffer window.");
    return;
  }

  console.log(`Missing puzzles at day offsets: ${missing.join(", ")}`);
  await generatePuzzles(missing);
}

async function generatePuzzles(dayOffsets: number[]) {
  console.log("Starting...");
  const deckMap = griddening.createConstraintDeck();
  const recentSignatures = await dataService.getRecentPuzzleSignatures(puzzleUniquenessWindowDays);
  console.log(
    `Loaded ${recentSignatures.size} puzzle signature(s) from the last ${puzzleUniquenessWindowDays} days.`,
  );

  for (const dayOffset of dayOffsets) {
    console.log(`Generating puzzle for day offset ${dayOffset}...`);
    const puzzle = await puzzleGenerator.generateValidPuzzleWithTimeout(deckMap, recentSignatures);
    recentSignatures.add(computePuzzleSignature(puzzle));
    logPuzzle(puzzle);
    const dateStringFromOffset = griddening.getDateStringByOffset(dayOffset);
    console.log(`Creating game in DB for ${dateStringFromOffset}`);
    await dataService.createNewGame(dateStringFromOffset, [...puzzle.topRow, ...puzzle.sideRow]);
    console.log("\r\n\r\n");
  }
  console.log("Generation complete. Awaiting next cron trigger.");
}

// Calendar-day difference, so DST changes (23/25-hour days) can't shift the result.
export function calculateOffsetFromToday(date: Date, now: Date = new Date()) {
  const msPerDay = 1000 * 3600 * 24;
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / msPerDay);
}

// Day offsets in [0, buffer] (today through today + buffer) that have no game yet.
export function findMissingOffsets(
  existingDateStrings: Set<string>,
  buffer: number,
  now: Date = new Date(),
): number[] {
  const missing: number[] = [];
  for (let offset = 0; offset <= buffer; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (!existingDateStrings.has(toDateString(day))) missing.push(offset);
  }
  return missing;
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

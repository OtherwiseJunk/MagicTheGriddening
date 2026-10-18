// Replaces every puzzle dated after today with a freshly generated one (same dates, same count).
// Today's and past puzzles are never touched, to keep play stats consistent.
//
//   docker exec mtg-seeder npx tsx regenerate.ts [--dry-run]
//
// Run it away from the cron time (CRON_SCHEDULE, default 00:30): both processes write to the DB.
import { PrismaClient } from "@prisma/client";
import { toDateString } from "@griddening/shared";
import { CardDataService } from "./services/card-data.service.js";
import { DataService } from "./services/data.service.js";
import { GriddeningService } from "./services/griddening.service.js";
import {
  PuzzleGenerator,
  logPuzzle,
  puzzleUniquenessWindowDays,
} from "./services/puzzle-generation.js";
import { regenerateFuturePuzzles } from "./services/regeneration.service.js";

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = new PrismaClient();
  try {
    const dataService = new DataService(prisma);
    let generator: PuzzleGenerator | undefined;
    let griddening: GriddeningService | undefined;

    const result = await regenerateFuturePuzzles({
      dataService,
      today: toDateString(new Date()),
      windowDays: puzzleUniquenessWindowDays,
      dryRun,
      generatePuzzle: async (signatures) => {
        if (!generator || !griddening) {
          const cardDataService = new CardDataService();
          const [cards, sets] = await Promise.all([
            cardDataService.getCards(),
            cardDataService.getSets(),
          ]);
          griddening = new GriddeningService(cards, sets);
          generator = new PuzzleGenerator(griddening);
        }
        const puzzle = await generator.generateValidPuzzleWithTimeout(
          griddening.createConstraintDeck(),
          signatures,
        );
        logPuzzle(puzzle);
        return puzzle;
      },
    });

    if (dryRun) {
      console.log(
        `[dry run] would delete and regenerate ${result.dates.length} puzzle(s): ${result.dates.join(", ") || "none"}`,
      );
    } else {
      console.log(`Deleted ${result.deleted} puzzle(s), regenerated ${result.regenerated}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error("Regeneration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

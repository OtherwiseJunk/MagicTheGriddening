import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import { ConstraintType, GameConstraint } from "@griddening/shared/types";
import { prisma } from "@/lib/prisma";
import WebDataService from "@/services/data.service";
import { GET } from "@/app/api/gameState/[playerId]/route";
import { GriddeningService as SeederGriddeningService } from "../../../seeder/services/griddening.service";
import { DataService as SeederDataService } from "../../../seeder/services/data.service";
import { calculateOffsetFromToday } from "../../../seeder/main";

const constraints: GameConstraint[] = [
  new GameConstraint("Red", ConstraintType.Color, "c:R"),
  new GameConstraint("Power 1", ConstraintType.Power, "pow:1"),
  new GameConstraint("Soldier", ConstraintType.Type, "t:soldier"),
  new GameConstraint("Bird", ConstraintType.Type, "t:bird"),
  new GameConstraint("Green", ConstraintType.Color, "c:G"),
  new GameConstraint("Toughness 6", ConstraintType.Toughness, "tou:6"),
];

// Local noon avoids DST-transition edge cases when setting the fake clock.
const cases: { label: string; now: Date }[] = [
  { label: "mid-month", now: new Date(2026, 8, 25, 12) },
  { label: "last day of a 30-day month", now: new Date(2026, 8, 30, 12) },
  { label: "first day of a month", now: new Date(2026, 9, 1, 12) },
  { label: "January 1st", now: new Date(2027, 0, 1, 12) },
  { label: "January 31st", now: new Date(2027, 0, 31, 12) },
  { label: "December 31st", now: new Date(2026, 11, 31, 12) },
  { label: "leap day", now: new Date(2028, 1, 29, 12) },
];

async function resetDatabase() {
  await prisma.correctGuesses.deleteMany();
  await prisma.playerRecord.deleteMany();
  await prisma.game.deleteMany();
}

describe("seeder → web dateString contract (real database)", () => {
  const seederGriddening = new SeederGriddeningService();
  const seederData = new SeederDataService(prisma);
  const originalOverrideDate = process.env.OVERRIDE_DATE;

  beforeAll(() => {
    const url = process.env.DATABASE_URL ?? "";
    // These tests wipe tables; refuse to run against anything that isn't a throwaway database.
    if (!/_(integration|test)(\?|$)/.test(url)) {
      throw new Error(
        `Integration tests need DATABASE_URL pointing at a *_integration or *_test database, got "${url}"`,
      );
    }
    delete process.env.OVERRIDE_DATE;
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(async () => {
    await resetDatabase();
    process.env.OVERRIDE_DATE = originalOverrideDate;
    await prisma.$disconnect();
  });

  describe.each(cases)("on $label", ({ now }) => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(now);
    });

    it("web finds the game the seeder created for today", async () => {
      const created = await seederData.createNewGame(
        seederGriddening.getDateStringByOffset(0),
        constraints,
      );

      const todaysGame = await WebDataService.getTodaysGame();

      expect(todaysGame?.id).toBe(created.id);
    });

    it("gameState API serves today's constraints to the bsky bot", async () => {
      await seederData.createNewGame(seederGriddening.getDateStringByOffset(0), constraints);

      const playerId = "screenshotPoster";
      const response = await GET(new Request(`http://localhost/api/gameState/${playerId}`), {
        params: { playerId },
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.gameConstraints).toHaveLength(6);
    });

    it("web does not serve tomorrow's game today", async () => {
      await seederData.createNewGame(seederGriddening.getDateStringByOffset(1), constraints);

      expect(await WebDataService.getTodaysGame()).toBeUndefined();
    });

    it("seeder reads back its newest game as the right number of days ahead", async () => {
      for (let offset = 0; offset <= 4; offset++) {
        await seederData.createNewGame(seederGriddening.getDateStringByOffset(offset), constraints);
      }

      const newest = await seederData.getDateOfNewestGame();

      expect(calculateOffsetFromToday(newest!)).toBe(4);
    });
  });
});

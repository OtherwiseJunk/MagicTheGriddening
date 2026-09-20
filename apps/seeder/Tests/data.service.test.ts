import { DataService } from "../services/data.service.js";
import { prismaMock } from "../__mocks__/databaseClient.js";
import { expect, test, describe } from "vitest";
import { Game } from "@prisma/client";
import { GameConstraint, ConstraintType } from "@griddening/shared";
import { computeSignatureFromStoredConstraints } from "../services/puzzle-signature.js";

function constraint(displayName: string): GameConstraint {
  return new GameConstraint(displayName, ConstraintType.Color, `query:${displayName}`);
}

function gameOn(id: number, dateString: string, constraints: GameConstraint[]): Game {
  return { id, dateString, constraintsJSON: JSON.stringify(constraints) };
}

function dateStringDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

const invalidDateStrings = [
  { invalidDateString: "" },
  { invalidDateString: "0123456" },
  { invalidDateString: "012345678" },
];

const games: Game[] = [
  {
    id: 1,
    dateString: "19690420",
    constraintsJSON: "",
  },
  {
    id: 2,
    dateString: "19840521",
    constraintsJSON: "",
  },
];

const dataService = new DataService(prismaMock);

describe("Data Service", () => {
  describe("getDateOfNewestGame", () => {
    test("() -> undefined", async () => {
      const latestDate = await dataService.getDateOfNewestGame();

      expect(latestDate).toBe(undefined);
    });

    test("() -> most recent date", async () => {
      prismaMock.game.findFirst.mockResolvedValue(games[1]);

      const gameDate: Date | undefined = await dataService.getDateOfNewestGame();

      expect(gameDate).not.toBe(undefined);
      expect(gameDate!.toDateString()).toBe(new Date("05/21/1984").toDateString());
    });
  });

  describe("dateStringToDate", () => {
    test.each(invalidDateStrings)(
      "('$invalidDateString') -> undefined",
      ({ invalidDateString }) => {
        const result = dataService.dateStringToDate(invalidDateString);
        expect(result).toBe(undefined);
      },
    );

    test("should return expected datetime for valid string", () => {
      const dateOne = dataService.dateStringToDate("19841231");
      expect(dateOne!.toDateString()).toBe(new Date("12/31/1984").toDateString());
      const dateTwo = dataService.dateStringToDate("19840101");
      expect(dateTwo!.toDateString()).toBe(new Date(1984, 0, 1).toDateString());
    });
  });

  describe("getRecentPuzzleSignatures", () => {
    test("returns an empty set when no games exist", async () => {
      prismaMock.game.findMany.mockResolvedValue([]);
      const signatures = await dataService.getRecentPuzzleSignatures(1826);
      expect(signatures.size).toBe(0);
    });

    test("includes a game's signature when within the window", async () => {
      const constraints = [
        constraint("A"),
        constraint("B"),
        constraint("C"),
        constraint("D"),
        constraint("E"),
        constraint("F"),
      ];
      prismaMock.game.findMany.mockResolvedValue([gameOn(1, dateStringDaysAgo(10), constraints)]);

      const signatures = await dataService.getRecentPuzzleSignatures(1826);

      expect(signatures.has(computeSignatureFromStoredConstraints(constraints))).toBe(true);
    });

    test("excludes a game older than the window", async () => {
      const constraints = [
        constraint("A"),
        constraint("B"),
        constraint("C"),
        constraint("D"),
        constraint("E"),
        constraint("F"),
      ];
      prismaMock.game.findMany.mockResolvedValue([gameOn(1, dateStringDaysAgo(1827), constraints)]);

      const signatures = await dataService.getRecentPuzzleSignatures(1826);

      expect(signatures.has(computeSignatureFromStoredConstraints(constraints))).toBe(false);
    });

    test("skips a row with unparsable constraintsJSON instead of throwing", async () => {
      prismaMock.game.findMany.mockResolvedValue([
        { id: 1, dateString: dateStringDaysAgo(10), constraintsJSON: "" },
      ]);

      await expect(dataService.getRecentPuzzleSignatures(1826)).resolves.toBeInstanceOf(Set);
    });
  });
});

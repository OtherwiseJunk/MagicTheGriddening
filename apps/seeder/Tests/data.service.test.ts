import { DataService } from "../services/data.service.js";
import { prismaMock } from "../__mocks__/databaseClient.js";
import { expect, test, describe } from "vitest";
import { Game } from "@prisma/client";

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

      const gameDate: Date | undefined =
        await dataService.getDateOfNewestGame();

      expect(gameDate).not.toBe(undefined);
      expect(gameDate!.toDateString()).toBe(
        new Date("05/21/1984").toDateString(),
      );
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
      expect(dateOne!.toDateString()).toBe(
        new Date("12/31/1984").toDateString(),
      );
      const dateTwo = dataService.dateStringToDate("19840101");
      expect(dateTwo!.toDateString()).toBe(new Date(1984, 0, 1).toDateString());
    });
  });
});

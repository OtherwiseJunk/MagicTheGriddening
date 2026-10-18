import { describe, expect, test, vi } from "vitest";
import { ConstraintType, GameConstraint } from "@griddening/shared";
import { regenerateFuturePuzzles } from "../services/regeneration.service.js";
import { Puzzle, PuzzleType } from "../types/Puzzle.js";
import { computePuzzleSignature } from "../services/puzzle-signature.js";

function constraint(displayName: string): GameConstraint {
  return new GameConstraint(displayName, ConstraintType.Color, `query:${displayName}`);
}

function puzzleNamed(prefix: string): Puzzle {
  return {
    type: PuzzleType.FourColors,
    subType: 0,
    topRow: ["1", "2", "3"].map((n) => constraint(`${prefix}${n}`)),
    sideRow: ["4", "5", "6"].map((n) => constraint(`${prefix}${n}`)),
  };
}

function futureGame(
  id: number,
  dateString: string,
  played = { playerRecords: 0, correctGuesses: 0 },
) {
  return { id, dateString, constraintsJSON: "[]", _count: played };
}

function setup(games: ReturnType<typeof futureGame>[]) {
  const dataService = {
    getGamesAfter: vi.fn().mockResolvedValue(games),
    getRecentPuzzleSignatures: vi.fn().mockResolvedValue(new Set<string>()),
    replaceGames: vi.fn().mockResolvedValue(undefined),
  };
  let calls = 0;
  const generatePuzzle = vi.fn(async () => puzzleNamed(`p${++calls}-`));
  return { dataService, generatePuzzle };
}

describe("regenerateFuturePuzzles", () => {
  test("only looks at games after today", async () => {
    const { dataService, generatePuzzle } = setup([]);

    await regenerateFuturePuzzles({
      dataService,
      generatePuzzle,
      today: "20261017",
      windowDays: 1826,
    });

    expect(dataService.getGamesAfter).toHaveBeenCalledWith("20261017");
  });

  test("does nothing when there are no future games", async () => {
    const { dataService, generatePuzzle } = setup([]);

    const result = await regenerateFuturePuzzles({
      dataService,
      generatePuzzle,
      today: "20261017",
      windowDays: 1826,
    });

    expect(result).toEqual({ dates: [], deleted: 0, regenerated: 0 });
    expect(generatePuzzle).not.toHaveBeenCalled();
    expect(dataService.replaceGames).not.toHaveBeenCalled();
  });

  test("regenerates exactly as many puzzles as it deletes, on the same dates", async () => {
    const { dataService, generatePuzzle } = setup([
      futureGame(11, "20261018"),
      futureGame(12, "20261019"),
      futureGame(13, "20261020"),
    ]);

    const result = await regenerateFuturePuzzles({
      dataService,
      generatePuzzle,
      today: "20261017",
      windowDays: 1826,
    });

    expect(result).toEqual({
      dates: ["20261018", "20261019", "20261020"],
      deleted: 3,
      regenerated: 3,
    });
    expect(generatePuzzle).toHaveBeenCalledTimes(3);
    const [ids, newGames] = dataService.replaceGames.mock.calls[0];
    expect(ids).toEqual([11, 12, 13]);
    expect(newGames.map((g: { dateString: string }) => g.dateString)).toEqual([
      "20261018",
      "20261019",
      "20261020",
    ]);
    expect(JSON.parse(newGames[0].constraintsJSON)).toHaveLength(6);
  });

  test("excludes the replaced dates when loading signatures to avoid", async () => {
    const { dataService, generatePuzzle } = setup([futureGame(11, "20261018")]);

    await regenerateFuturePuzzles({
      dataService,
      generatePuzzle,
      today: "20261017",
      windowDays: 1826,
    });

    expect(dataService.getRecentPuzzleSignatures).toHaveBeenCalledWith(1826, new Set(["20261018"]));
  });

  test("adds each new puzzle's signature so later ones cannot duplicate it", async () => {
    const { dataService, generatePuzzle } = setup([
      futureGame(11, "20261018"),
      futureGame(12, "20261019"),
    ]);

    await regenerateFuturePuzzles({
      dataService,
      generatePuzzle,
      today: "20261017",
      windowDays: 1826,
    });

    const secondCallSignatures = generatePuzzle.mock.calls[1][0] as Set<string>;
    expect(secondCallSignatures.has(computePuzzleSignature(puzzleNamed("p1-")))).toBe(true);
  });

  test("refuses, touching nothing, if any future game already has play data", async () => {
    const { dataService, generatePuzzle } = setup([
      futureGame(11, "20261018"),
      futureGame(12, "20261019", { playerRecords: 1, correctGuesses: 2 }),
    ]);

    await expect(
      regenerateFuturePuzzles({ dataService, generatePuzzle, today: "20261017", windowDays: 1826 }),
    ).rejects.toThrow(/20261019/);
    expect(generatePuzzle).not.toHaveBeenCalled();
    expect(dataService.replaceGames).not.toHaveBeenCalled();
  });

  test("dry run reports the dates but generates and writes nothing", async () => {
    const { dataService, generatePuzzle } = setup([futureGame(11, "20261018")]);

    const result = await regenerateFuturePuzzles({
      dataService,
      generatePuzzle,
      today: "20261017",
      windowDays: 1826,
      dryRun: true,
    });

    expect(result).toEqual({ dates: ["20261018"], deleted: 0, regenerated: 0 });
    expect(generatePuzzle).not.toHaveBeenCalled();
    expect(dataService.replaceGames).not.toHaveBeenCalled();
  });

  test("does not delete anything if generation fails", async () => {
    const { dataService } = setup([futureGame(11, "20261018")]);
    const generatePuzzle = vi.fn().mockRejectedValue(new Error("timeout"));

    await expect(
      regenerateFuturePuzzles({ dataService, generatePuzzle, today: "20261017", windowDays: 1826 }),
    ).rejects.toThrow("timeout");
    expect(dataService.replaceGames).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import DataService from "@/services/data.service";
import { Game } from "@/models/database/game";
import { CorrectGuess } from "@/models/UI/correctGuess";

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    game: {
      findFirst: vi.fn(),
    },
    playerRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    correctGuesses: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from "@/lib/prisma";

const mockPrisma = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DataService", () => {
  describe("getNewestGame", () => {
    it("returns the newest game ordered by dateString desc", async () => {
      mockPrisma.game.findFirst.mockResolvedValue({
        id: 5,
        dateString: "20260405",
        constraintsJSON: "[]",
      });

      const result = await DataService.getNewestGame();

      expect(mockPrisma.game.findFirst).toHaveBeenCalledWith({
        orderBy: { dateString: "desc" },
      });
      expect(result).toBeInstanceOf(Game);
      expect(result?.id).toBe(5);
      expect(result?.dateString).toBe("20260405");
    });

    it("returns undefined when no games exist", async () => {
      mockPrisma.game.findFirst.mockResolvedValue(null);

      const result = await DataService.getNewestGame();

      expect(result).toBeUndefined();
    });
  });

  describe("getTodaysGame", () => {
    it("returns today's game when it exists", async () => {
      mockPrisma.game.findFirst.mockResolvedValue({
        id: 1,
        dateString: "20260305",
        constraintsJSON: '[{"displayName":"Red"}]',
      });

      const result = await DataService.getTodaysGame();

      expect(result).toBeInstanceOf(Game);
      expect(result?.constraintsJSON).toBe('[{"displayName":"Red"}]');
    });

    it("returns undefined when no game exists for today", async () => {
      mockPrisma.game.findFirst.mockResolvedValue(null);

      const result = await DataService.getTodaysGame();

      expect(result).toBeUndefined();
    });
  });

  describe("getPlayerGameData", () => {
    it("returns life points and correct guesses for existing player", async () => {
      mockPrisma.playerRecord.findFirst.mockResolvedValue({
        id: 1,
        playerId: "test-uuid",
        gameId: 1,
        lifePoints: 7,
        correctGuesses: [
          { id: 1, playerRecordId: 1, gameId: 1, squareIndex: 0, correctGuess: "Lightning Bolt", imageSource: "bolt.png" },
          { id: 2, playerRecordId: 1, gameId: 1, squareIndex: 4, correctGuess: "Giant Growth", imageSource: "growth.png" },
        ],
      } as any);

      const [lifePoints, guesses] = await DataService.getPlayerGameData(1, "test-uuid");

      expect(lifePoints).toBe(7);
      expect(guesses).toHaveLength(2);
      expect(guesses[0]).toBeInstanceOf(CorrectGuess);
      expect(guesses[0].cardName).toBe("Lightning Bolt");
      expect(guesses[1].squareIndex).toBe(4);
    });

    it("filters correct guesses to only the requested game", async () => {
      mockPrisma.playerRecord.findFirst.mockResolvedValue({
        id: 1,
        playerId: "test-uuid",
        gameId: 1,
        lifePoints: 5,
        correctGuesses: [
          { id: 1, playerRecordId: 1, gameId: 1, squareIndex: 0, correctGuess: "Bolt", imageSource: "bolt.png" },
          { id: 2, playerRecordId: 1, gameId: 2, squareIndex: 1, correctGuess: "Growth", imageSource: "growth.png" },
        ],
      } as any);

      const [, guesses] = await DataService.getPlayerGameData(1, "test-uuid");

      expect(guesses).toHaveLength(1);
      expect(guesses[0].cardName).toBe("Bolt");
    });

    it("returns -1 life and empty guesses for unknown player", async () => {
      mockPrisma.playerRecord.findFirst.mockResolvedValue(null);

      const [lifePoints, guesses] = await DataService.getPlayerGameData(1, "unknown-uuid");

      expect(lifePoints).toBe(-1);
      expect(guesses).toHaveLength(0);
    });
  });

  describe("getPlayerRecord", () => {
    it("returns existing player record", async () => {
      const existing = { id: 1, playerId: "test-uuid", gameId: 1, lifePoints: 9 };
      mockPrisma.playerRecord.findFirst.mockResolvedValue(existing);

      const result = await DataService.getPlayerRecord("test-uuid", 1);

      expect(result).toEqual(existing);
      expect(mockPrisma.playerRecord.create).not.toHaveBeenCalled();
    });

    it("creates a new record when player doesn't exist", async () => {
      const newRecord = { id: 2, playerId: "new-uuid", gameId: 1, lifePoints: 9 };
      mockPrisma.playerRecord.findFirst.mockResolvedValue(null);
      mockPrisma.playerRecord.create.mockResolvedValue(newRecord);

      const result = await DataService.getPlayerRecord("new-uuid", 1);

      expect(result).toEqual(newRecord);
      expect(mockPrisma.playerRecord.create).toHaveBeenCalledWith({
        data: { playerId: "new-uuid", lifePoints: 9, gameId: 1 },
      });
    });
  });

  describe("updatePlayerLifeValue", () => {
    it("updates the player record with new life points", async () => {
      mockPrisma.playerRecord.update.mockResolvedValue({} as any);

      await DataService.updatePlayerLifeValue(1, 7);

      expect(mockPrisma.playerRecord.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lifePoints: 7 },
      });
    });
  });

  describe("getCorrectGuessesForPlayer", () => {
    it("returns correct guess card names", async () => {
      mockPrisma.correctGuesses.findMany.mockResolvedValue([
        { correctGuess: "Lightning Bolt" },
        { correctGuess: "Giant Growth" },
      ] as any);

      const result = await DataService.getCorrectGuessesForPlayer(1, 1);

      expect(result).toHaveLength(2);
      expect(result[0].correctGuess).toBe("Lightning Bolt");
      expect(mockPrisma.correctGuesses.findMany).toHaveBeenCalledWith({
        where: { playerRecordId: 1, gameId: 1 },
        select: { correctGuess: true },
      });
    });

    it("returns empty array when no guesses exist", async () => {
      mockPrisma.correctGuesses.findMany.mockResolvedValue([]);

      const result = await DataService.getCorrectGuessesForPlayer(1, 1);

      expect(result).toHaveLength(0);
    });
  });

  describe("createCorrectGuess", () => {
    it("creates a correct guess record", async () => {
      mockPrisma.correctGuesses.create.mockResolvedValue({} as any);

      await DataService.createCorrectGuess(1, 1, 4, "Lightning Bolt", "bolt.png");

      expect(mockPrisma.correctGuesses.create).toHaveBeenCalledWith({
        data: {
          playerRecordId: 1,
          gameId: 1,
          squareIndex: 4,
          correctGuess: "Lightning Bolt",
          imageSource: "bolt.png",
        },
      });
    });
  });
});

import { type PlayerRecord } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Game } from "@/models/database/game";
import { CorrectGuess } from "@/models/UI/correctGuess";
import GriddeningService from "./griddening.service";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/shortCode";
import { type PlayerStats } from "@/models/UI/playerStats";

export default class DataService {
  private static readonly prisma = prisma;

  static async getNewestGame(): Promise<Game | undefined> {
    const game = await this.prisma.game.findFirst({
      orderBy: { dateString: "desc" },
    });

    if (game === null) return undefined;

    return new Game(game.id, game.dateString, game.constraintsJSON);
  }

  static async getTodaysGame(): Promise<Game | undefined> {
    const game = await this.prisma.game.findFirst({
      where: {
        dateString: GriddeningService.getTodaysDateString(),
      },
    });

    if (game !== null) {
      return new Game(game.id, game.dateString, game.constraintsJSON);
    }
    return undefined;
  }

  static async getPlayerGameData(
    gameId: number,
    playerId: string,
  ): Promise<[number, CorrectGuess[]]> {
    const playerRecord = await this.prisma.playerRecord.findFirst({
      where: {
        playerId,
        gameId,
      },
      include: {
        correctGuesses: true,
      },
    });

    if (playerRecord != null) {
      const correctGuessesForGame = playerRecord.correctGuesses
        .filter((guess) => guess.gameId === gameId)
        .map((guess) => new CorrectGuess(guess.correctGuess, guess.imageSource, guess.squareIndex));
      return [playerRecord.lifePoints, correctGuessesForGame];
    }
    return [-1, []];
  }

  static async getPlayerRecord(playerId: string, gameId: number): Promise<PlayerRecord> {
    let playerRecord = await this.prisma.playerRecord.findFirst({
      where: {
        playerId,
        gameId,
      },
    });

    if (playerRecord === null) {
      playerRecord = await this.createNewPlayerRecord(playerId, gameId);
    }

    return playerRecord;
  }

  static async createNewPlayerRecord(playerGuid: string, gameId: number): Promise<PlayerRecord> {
    return await this.prisma.playerRecord.create({
      data: {
        playerId: playerGuid,
        lifePoints: 9,
        gameId,
      },
    });
  }

  static async updatePlayerLifeValue(playerRecordId: number, newLifepoints: number): Promise<void> {
    await this.prisma.playerRecord.update({
      where: {
        id: playerRecordId,
      },
      data: {
        lifePoints: newLifepoints,
      },
    });
  }

  static async getCorrectGuessesForPlayer(
    playerRecordId: number,
    gameId: number,
  ): Promise<Array<{ correctGuess: string }>> {
    return await this.prisma.correctGuesses.findMany({
      where: { playerRecordId, gameId },
      select: { correctGuess: true },
    });
  }

  static async findOrCreatePlayer(playerId: string): Promise<{ shortCode: string }> {
    const existing = await this.prisma.player.findUnique({ where: { uuid: playerId } });
    if (existing) return { shortCode: existing.shortCode };

    const MAX_ATTEMPTS = 10;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const shortCode = generateShortCode();
      try {
        const player = await this.prisma.player.create({ data: { uuid: playerId, shortCode } });
        return { shortCode: player.shortCode };
      } catch (err) {
        if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") throw err;
      }
    }
    throw new Error("Failed to generate unique short code after 10 attempts");
  }

  static async findPlayerByShortCode(shortCode: string): Promise<{ playerId: string } | undefined> {
    const player = await this.prisma.player.findUnique({ where: { shortCode } });
    if (!player) return undefined;
    return { playerId: player.uuid };
  }

  static async getPlayerStats(playerId: string): Promise<PlayerStats> {
    const records = await this.prisma.playerRecord.findMany({
      where: { playerId },
      include: { game: true, correctGuesses: true },
    });

    // Array values represent count of games at each index
    // with index as the number of correct guesses 
    // (e.g. [0,1,0,0,0,0,0,0,0,0] means the player has played one game, 
    // where they got 1 correct guess) 
    const scoreDistribution = Array<number>(10).fill(0);
    const gameData = records.map((r) => {
      const count = r.correctGuesses.length;
      scoreDistribution[count]++;
      return { dateString: r.game.dateString, count };
    });

    const gamesPlayed = records.length;
    const gamesCompleted = gameData.filter((g) => g.count === 9).length;

    const sorted = gameData
      .map((g) => g.dateString)
      .sort()
      .reverse();
    let currentStreak = 0;
    let bestStreak = 0;
    let streak = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        streak = 1;
      } else {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const prevDate = new Date(`${prev.slice(0, 4)}-${prev.slice(4, 6)}-${prev.slice(6)}`);
        const currDate = new Date(`${curr.slice(0, 4)}-${curr.slice(4, 6)}-${curr.slice(6)}`);
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
        if (diffDays === 1) {
          streak++;
        } else {
          bestStreak = Math.max(bestStreak, streak);
          streak = 1;
        }
      }
    }
    bestStreak = Math.max(bestStreak, streak);

    const todayString = GriddeningService.getTodaysDateString();
    currentStreak = sorted[0] === todayString ? streak : 0;

    return { gamesPlayed, gamesCompleted, currentStreak, bestStreak, scoreDistribution };
  }

  static async getGlobalCardPicks(
    gameId: number,
    squareIndex: number,
  ): Promise<{ available: boolean; totalPlayers?: number; picks?: { card: string; count: number }[] }> {
    const totalPlayers = await this.prisma.playerRecord.count({ where: { gameId } });
    if (totalPlayers < 10) return { available: false };

    const grouped = await this.prisma.correctGuesses.groupBy({
      by: ["correctGuess"],
      where: { gameId, squareIndex },
      _count: { correctGuess: true },
      orderBy: { _count: { correctGuess: "desc" } },
    });

    return {
      available: true,
      totalPlayers,
      picks: grouped.map((g) => ({ card: g.correctGuess, count: g._count.correctGuess })),
    };
  }

  static async createCorrectGuess(
    playerRecordId: number,
    gameId: number,
    squareIndex: number,
    cardName: string,
    cardImageUrl: string,
  ): Promise<void> {
    await this.prisma.correctGuesses.create({
      data: {
        playerRecordId,
        gameId,
        squareIndex,
        correctGuess: cardName,
        imageSource: cardImageUrl,
      },
    });
  }
}

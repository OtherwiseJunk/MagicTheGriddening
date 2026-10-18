import { Game, PrismaClient } from "@prisma/client";
import { GameConstraint, fromDateString } from "@griddening/shared";
import { computeSignatureFromStoredConstraints } from "./puzzle-signature.js";

export class DataService {
  constructor(private prisma: PrismaClient) {}

  async getDateOfNewestGame(): Promise<Date | undefined> {
    const latestGame = await this.prisma.game.findFirst({
      orderBy: {
        dateString: "desc",
      },
    });

    if (!latestGame) {
      return undefined;
    }

    return this.dateStringToDate(latestGame.dateString);
  }

  async createNewGame(dateString: string, validGameConstraints: GameConstraint[]): Promise<Game> {
    const existing = await this.prisma.game.findUnique({ where: { dateString } });
    if (existing) {
      console.log(`[createNewGame] ${dateString} already exists — skipping`);
      return existing;
    }
    return await this.prisma.game.create({
      data: { dateString, constraintsJSON: JSON.stringify(validGameConstraints) },
    });
  }

  // Games dated strictly after dateString (YYYYMMDD sorts lexicographically), with how many
  // player records and guesses reference each so callers can refuse to touch played games.
  async getGamesAfter(dateString: string) {
    return await this.prisma.game.findMany({
      where: { dateString: { gt: dateString } },
      orderBy: { dateString: "asc" },
      include: { _count: { select: { playerRecords: true, correctGuesses: true } } },
    });
  }

  async replaceGames(
    idsToDelete: number[],
    newGames: { dateString: string; constraintsJSON: string }[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.game.deleteMany({ where: { id: { in: idsToDelete } } }),
      ...newGames.map((data) => this.prisma.game.create({ data })),
    ]);
  }

  async getRecentPuzzleSignatures(
    windowDays: number,
    excludeDateStrings: Set<string> = new Set(),
  ): Promise<Set<string>> {
    const games = await this.prisma.game.findMany();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);

    const signatures = new Set<string>();
    for (const game of games) {
      if (excludeDateStrings.has(game.dateString)) continue;
      const date = this.dateStringToDate(game.dateString);
      if (date === undefined || date.getTime() < cutoff.getTime()) continue;

      let constraints: GameConstraint[];
      try {
        constraints = JSON.parse(game.constraintsJSON);
      } catch {
        continue;
      }
      if (!Array.isArray(constraints) || constraints.length !== 6) continue;

      signatures.add(computeSignatureFromStoredConstraints(constraints));
    }
    return signatures;
  }

  dateStringToDate(dateString: string): Date | undefined {
    return fromDateString(dateString);
  }
}

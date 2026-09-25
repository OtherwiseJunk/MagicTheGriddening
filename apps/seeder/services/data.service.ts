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

  async getRecentPuzzleSignatures(windowDays: number): Promise<Set<string>> {
    const games = await this.prisma.game.findMany();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);

    const signatures = new Set<string>();
    for (const game of games) {
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

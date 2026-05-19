import { Game, PrismaClient } from "@prisma/client";
import { GameConstraint } from "../types/GameConstraint.js";

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

  async createNewGame(
    dateString: string,
    validGameConstraints: GameConstraint[],
  ): Promise<Game | undefined> {
    return await this.prisma.game.create({
      data: {
        dateString,
        constraintsJSON: JSON.stringify(validGameConstraints),
      },
    });
  }

  dateStringToDate(dateString: string): Date | undefined {
    if (dateString == null || dateString.length != 8) return undefined;

    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; // Date months are 0-indexed
    const day = parseInt(dateString.substring(6));

    return new Date(year, month, day);
  }
}

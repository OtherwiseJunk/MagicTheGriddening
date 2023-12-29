import { GameConstraint } from "@/models/UI/gameConstraint";
import { PlayerRecord, PrismaClient } from "@prisma/client";
import { Game } from "../models/database/game";
import { CorrectGuess } from "@/models/UI/correctGuess";
import GriddeningService from "./griddening.service";

export default class DataService{
  private static prisma = new PrismaClient();
  static async createNewGame(dateString: string, validGameConstraints: GameConstraint[]): Promise<Game|undefined> {
    const game = await this.prisma.game.create({
      data: {
        dateString: dateString,
        constraintsJSON: JSON.stringify(validGameConstraints),
      },
    });

    if(game){
      return new Game(game.id, game.dateString, game.constraintsJSON);
    }
    return undefined;
  }
  
  static async getNewestGame(): Promise<Game | undefined>{
    const games = await this.prisma.game.findMany();

    if(games.length === 0) return undefined;

    const game = games.sort((gameA, gameB)=> parseInt(gameB.dateString) - parseInt(gameA.dateString))[0] as Game

    return new Game(game.id, game.dateString, game.constraintsJSON);
  }

  static async getTodaysGame():Promise<Game | undefined> {
    const game =  (await this.prisma.game.findFirst({
      where: {
        dateString: GriddeningService.getTodaysDateString(),
      },
    }));
    
    if(game){
      return new Game(game.id, game.dateString, game.constraintsJSON);
    }
    return undefined;
  }

  static async getPlayerGameData(gameId: number, playerId: string): Promise<[number, CorrectGuess[]]> {
    const playerRecord =  await this.prisma.playerRecord.findFirst({
      where: {
        playerId: playerId,
        gameId: gameId,
      },
      include: {
        correctGuesses: true,
      },
    });

    if(playerRecord){
      const correctGuessesForGame = playerRecord.correctGuesses.filter((guess) => guess.gameId === gameId).map((guess) => new CorrectGuess(guess.correctGuess, guess.imageSource, guess.squareIndex))
      return [playerRecord.lifePoints, correctGuessesForGame]
    }
    return [-1, []];
  }

  static async getPlayerRecord(playerId: string, gameId: number): Promise<PlayerRecord>{
    let playerRecord = await this.prisma.playerRecord.findFirst({
      where:{
        playerId
      }
    }) as PlayerRecord;

    if(playerRecord === null){
      playerRecord = await this.createNewPlayerRecord(playerId, gameId)
    }

    return playerRecord;
  }

  static async createNewPlayerRecord(playerGuid: string, gameId: number): Promise<PlayerRecord>{
    return await this.prisma.playerRecord.create({
      data:{
        playerId: playerGuid,
        lifePoints: 9,
        gameId: gameId
      }
    }) as PlayerRecord
  }

  static async updatePlayerLifeValue(playerId: number, newLifepoints: number){
    await this.prisma.playerRecord.update({
      where:{
        id: playerId
      },
      data:{
        lifePoints: newLifepoints
      }
    })
  }

  static async createCorrectGuess(playerId: number, gameId: number, squareIndex: number, cardName: string, cardImageUrl: string): Promise<void>{
    await this.prisma.correctGuesses.create({
      data: {
        playerRecordId: playerId,
        gameId,
        squareIndex,
        correctGuess: cardName,
        imageSource: cardImageUrl
      },
    });
  }
}

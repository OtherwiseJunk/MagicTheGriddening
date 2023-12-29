import { GameState } from "@/models/UI/gameState";
import { GameConstraint } from "@/models/UI/gameConstraint";
import DataService from "@/services/data.service";
import { CorrectGuess } from "@/models/UI/correctGuess";

export async function GET(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  const gameState = await buildGameStateForUser(params.playerId);  
  if(gameState.gameConstraints.length){
    return new Response(
        JSON.stringify(gameState)
      );
  }

  return new Response(null, {status: 500, statusText: "Failed to retrieve today's game :-("});  
}

async function buildGameStateForUser(playerId: string): Promise<GameState> {
  const [gameConstraints, gameId] = await getGameData();
  const [lifePoints, correctGuesses] = await getUserDataForGame(
    playerId,
    gameId
  );
  const gameState = new GameState(gameConstraints, lifePoints, correctGuesses);
  return gameState;
}

async function getGameData(): Promise<[GameConstraint[], number]> {
  let game = await DataService.getTodaysGame();
  if (!game) {
    console.log('Ran into an issue getting today\'s game :(');
    return [[], 0]
  }

  return [game.toUIObject(), game!.id];
}

async function getUserDataForGame(
  playerId: string,
  gameId: number
): Promise<
  [number, CorrectGuess[]]
> {
  const [lifePoints, correctGuesses] =  await DataService.getPlayerGameData(gameId, playerId);

  if (lifePoints !== -1) {
    return [lifePoints, correctGuesses];  
  }

  return [9, correctGuesses]
}


import { type CorrectGuess } from "./correctGuess";
import { type GameConstraint } from "@griddening/shared/types";

export class GameState {
  constructor(
    public gameConstraints: GameConstraint[],
    public lifePoints: number,
    public correctGuesses: CorrectGuess[],
    public gameId?: number,
  ) {}
}

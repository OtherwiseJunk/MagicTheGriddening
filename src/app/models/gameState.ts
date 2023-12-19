import { CorrectGuess } from "./correctGuess";
import { GameConstraint } from "./headerSquareInfo";

export class GameState{
    constructor(
        public gameConstraints: GameConstraint[], 
        public lifePoints: number,
        public correctGuesses: CorrectGuess[]
    ){}
}
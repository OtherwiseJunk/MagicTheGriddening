import { CorrectGuess } from "./correctGuess";
import { GameConstraint } from "./gameConstraint";

export class GameState {
    constructor(
        public gameConstraints: GameConstraint[],
        public lifePoints: number,
        public correctGuesses: CorrectGuess[]
    ) { }
}

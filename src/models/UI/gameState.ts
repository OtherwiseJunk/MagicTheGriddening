import { type CorrectGuess } from './correctGuess'
import { type GameConstraint } from './gameConstraint'

export class GameState {
  constructor (
    public gameConstraints: GameConstraint[],
    public lifePoints: number,
    public correctGuesses: CorrectGuess[]
  ) { }
}

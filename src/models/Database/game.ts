import { GameConstraint } from '../UI/gameConstraint';

export class Game {
    constructor(public id: number, public day: string, public constraintsJSON: string) { }

    toUIObject(): GameConstraint[] {
        return JSON.parse(this.constraintsJSON);
    }
}

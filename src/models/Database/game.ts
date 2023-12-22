import { GameConstraint } from '../UI/gameConstraint';

export class Game {
    constructor(public id: number, public dateString: string, public constraintsJSON: string) { }

    toUIObject(): GameConstraint[] {
        return JSON.parse(this.constraintsJSON);
    }

    dateStringToDate(): Date{
        const year = parseInt(this.dateString.substring(0,4));
        const month = parseInt(this.dateString.substring(4,6));
        const day = parseInt(this.dateString.substring(6));
        return new Date(`${month+1}/${day}/${year}`)
    }
}

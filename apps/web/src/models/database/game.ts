import { type GameConstraint } from "@griddening/shared/types";
import { fromDateString } from "@griddening/shared/date-string";

export class Game {
  constructor(
    public id: number,
    public dateString: string,
    public constraintsJSON: string,
  ) {}

  toUIObject(): GameConstraint[] {
    return JSON.parse(this.constraintsJSON);
  }

  dateStringToDate(): Date | undefined {
    return fromDateString(this.dateString);
  }
}

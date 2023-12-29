
export class GameConstraint {
  constructor(
    public displayName: string,
    public constraintType: ConstraintType,
    public scryfallQuery: string = "",
    public imageSrc: string = "",
    public imageAltText: string = ""
  ) {
    if (scryfallQuery.length === 0 && constraintType === ConstraintType.Type) {
      this.scryfallQuery = `type:${displayName}`;
    }
  }
}

export enum ConstraintType {
  Rarity,
  Type,
  ManaValue,
  Color,
  Set,
}

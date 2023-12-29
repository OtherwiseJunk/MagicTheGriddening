const colorToColorCode = new Map<string,string>([
    ["White","w"],
    ["Blue","u"],
    ["Black","b"],
    ["Red","r"],
    ["Green","g"],
    ["Colorless","c"]
]);    

const rarityToRarityCode = new Map<string,string>([
    ["Mythic", "m"],
    ["Rare", "r"],
    ["Uncommon", "u"],
    ["Common", "c"]
]);

export class GameConstraint {
  constructor(
    public displayName: string,
    public constraintType: ConstraintType,
    public scryfallQuery: string = "",
    public imageSrc: string = "",
    public imageAltText: string = ""
  ) {
    if (scryfallQuery.length === 0) {
      switch (constraintType) {
        case ConstraintType.ManaValue:
            this.scryfallQuery = `cmc:${parseInt(displayName.split(" ")[2])}`;
          break;
        case ConstraintType.Rarity:
            this.scryfallQuery = `r:${rarityToRarityCode.get(displayName)}`;
          break;
        case ConstraintType.Type:
            this.scryfallQuery = `type:${displayName}`;
          break;
      }
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

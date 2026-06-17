import { type LocalCard } from "./local-card";

export enum ConstraintType {
  Rarity,
  Type,
  ManaValue,
  Color,
  Set,
  Power,
  Toughness,
  Artist,
  CreatureRulesText,
  CreatureRaceTypes,
  CreatureJobTypes,
  ArtifactSubtypes,
  EnchantmentSubtypes,
  __LENGTH,
}

export class GameConstraint {
  public localFilter?: (card: LocalCard) => boolean;

  constructor(
    public displayName: string,
    public constraintType: ConstraintType,
    public scryfallQuery: string,
    public imageSrc: string = "",
    public imageAltText: string = "",
  ) {}
}

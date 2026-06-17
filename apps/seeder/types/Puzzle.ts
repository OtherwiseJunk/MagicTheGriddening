import { GameConstraint } from "@griddening/shared";

export enum PuzzleType {
  CreatureFocused,
  Colorless,
  TwoColors,
  FourColors,
  ArtistFocused,
  //ArtifactFocused,
  //PlaneswalkerFocused,
  //EnchantmentFocused,
  //InstantOrSorceryFocused,
  //LandFocused,
}

export type Puzzle = {
  type: PuzzleType;
  subType: number;
  topRow: GameConstraint[];
  sideRow: GameConstraint[];
};

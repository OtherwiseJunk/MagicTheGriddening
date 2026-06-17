import { type LocalCard } from "./local-card";
import { type LocalSet } from "./local-set";

export interface CardIndexFile {
  generatedAt: string;
  sourceUpdatedAt: string;
  cards: LocalCard[];
  sets?: LocalSet[];
}

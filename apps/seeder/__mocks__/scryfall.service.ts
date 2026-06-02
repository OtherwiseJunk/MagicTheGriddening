/* eslint-disable @typescript-eslint/no-unused-vars */
import { IScryfallService } from "../services/scryfall.service";
import * as Scry from "scryfall-sdk";

export class ScryfallMockedService implements IScryfallService {
  private allSets: Scry.Set[] = [];
  private hitCount: number = 0;

  getAllSets(): Promise<Scry.Set[]> {
    return Promise.resolve(this.allSets);
  }
  getFirstPageCardCount(query: string): Promise<number> {
    return Promise.resolve(this.hitCount);
  }

  setAllSets(sets: Scry.Set[]) {
    this.allSets = sets;
  }
  setHitCount(count: number) {
    this.hitCount = count;
  }
}

import * as Scry from "scryfall-sdk";

export class ScryfallService implements IScryfallService {
  constructor(private scry: typeof Scry) {}
  queryCountMap = new Map();

  async getAllSets(): Promise<Scry.Set[]> {
    return await this.scry.Sets.all();
  }

  async getFirstPageCardCount(query: string): Promise<number> {
    if (this.queryCountMap.has(query)) {
      return this.queryCountMap.get(query);
    }
    const queryCardCount = (
      await Scry.Cards.search(query, 1).cancelAfterPage().waitForAll()
    ).length;
    this.queryCountMap.set(query, queryCardCount);
    return queryCardCount;
  }
}

export interface IScryfallService {
  getAllSets(): Promise<Scry.Set[]>;
  getFirstPageCardCount(query: string): Promise<number>;
}

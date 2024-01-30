/* eslint-disable @typescript-eslint/no-extraneous-class */
import * as Scry from 'scryfall-sdk'

export default class ScryfallService {
  static queryCountMap = new Map()

  static async getCards (query: string): Promise<Scry.Card[]> {
    return await Scry.Cards.search(`${query} -is:digital`, { page: 1, unique: 'cards' })
      .cancelAfterPage()
      .waitForAll()
  }

  static async getFirstPageCardCount (query: string): Promise<number> {
    if (this.queryCountMap.has(query)) {
      return this.queryCountMap.get(query)
    }
    const queryCardCount = (
      await Scry.Cards.search(query, 1).cancelAfterPage().waitForAll()
    ).length
    this.queryCountMap.set(query, queryCardCount)
    return queryCardCount
  }
}

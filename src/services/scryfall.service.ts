import * as Scry from 'scryfall-sdk'
import { ConstraintType, GameConstraint } from '@/models/UI/gameConstraint'

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

  static async getSetConstraints (): Promise<GameConstraint[]> {
    const sets = await Scry.Sets.all()

    const sanitizedSets: Scry.Set[] = []

    sets.forEach((set) => {
      if (!['core', 'expansion'].includes(set.set_type)) return

      const santizedName = this.santizeSetName(set.name)

      if (!santizedName) return

      sanitizedSets.push(set)
    })

    const pioneerSets: Scry.Set[] = sanitizedSets.filter((set) => {
      const releaseDate = set.released_at
      const releaseYear = parseInt(releaseDate!.split('-')[0])
      if (releaseYear > 2012) {
        return true
      } else if (releaseDate === '2012-10-05') {
        return true
      }

      return false
    })

    const setConstraints: GameConstraint[] = []

    pioneerSets.forEach((set: Scry.Set) => {
      setConstraints.push(
        new GameConstraint(set.name, ConstraintType.Set, `set:${set.code}`)
      )
    })

    return setConstraints
  }

  private static santizeSetName (setName: string): string {
    return setName
      .replace('Foreign Black Border', '')
      .replace('Limited Edition Alpha', 'Alpha')
      .replace('Limited Edition Beta', 'Beta')
      .replace('Unlimited Edition', 'Unlimited')
      .replace('Revised Edition', 'Revised')
      .replace('Fourth Edition', '4th Edition')
      .replace('Fifth Edition', '5th Edition')
      .replace('Classic Sixth Edition', '6th Edition')
      .replace('Seventh Edition', '7th Edition')
      .replace('Eighth Edition', '8th Edition')
      .replace('Ninth Edition', '9th Edition')
      .replace('Tenth Edition', '10th Edition')
      .trim()
  }
}

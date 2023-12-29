import { colorConstraints, manaValueConstraints, rarityConstraints, typeConstraints } from '@/constants/constraintConstants'
import { ConstraintType, type GameConstraint } from '@/models/UI/gameConstraint'
import ScryfallService from './scryfall.service'

export default class GriddeningService {
  static async selectValidConstraints (constraintDeck: GameConstraint[]) {
    const solitaryConstraintTypes = [ConstraintType.Rarity, ConstraintType.ManaValue, ConstraintType.Type, ConstraintType.Set]
    const [topRowColorConstraint, bottomRowColorConstraint] =
      this.getColorConstraints(constraintDeck)
    let topRowConstraints = [topRowColorConstraint]
    let sideRowConstraints = [bottomRowColorConstraint]

    this.shuffleArray(solitaryConstraintTypes).forEach((constraintType, index) => {
      if (index < 2) {
        topRowConstraints.push(
          this.selectRandomConstraintOfType(constraintDeck, constraintType)
        )
      } else {
        sideRowConstraints.push(
          this.selectRandomConstraintOfType(constraintDeck, constraintType)
        )
      }
    })

    topRowConstraints = this.shuffleArray(topRowConstraints)
    sideRowConstraints = this.shuffleArray(sideRowConstraints)

    return (
      await this.replaceInvalidConstraints(
        topRowConstraints,
        sideRowConstraints,
        constraintDeck
      )
    )
  }

  static async replaceInvalidConstraints (
    topRowConstraints: GameConstraint[],
    sideRowConstraints: GameConstraint[],
    constraintDeck: GameConstraint[]
  ) {
    let allIntersectionsValidated = false
    while (!allIntersectionsValidated) {
      for (let i = 0; i < topRowConstraints.length; i++) {
        if (
          !(await this.intersectionHasMinimumNumberOfCards(
            topRowConstraints[i],
            sideRowConstraints[0],
            20
          ))
        ) {
          [topRowConstraints, sideRowConstraints] = this.rerollConstraints(
            topRowConstraints,
            i,
            sideRowConstraints,
            0,
            constraintDeck
          )
          break
        }
        if (
          !(await this.intersectionHasMinimumNumberOfCards(
            topRowConstraints[i],
            sideRowConstraints[1],
            20
          ))
        ) {
          [topRowConstraints, sideRowConstraints] = this.rerollConstraints(
            topRowConstraints,
            i,
            sideRowConstraints,
            1,
            constraintDeck
          )
          break
        }
        if (
          !(await this.intersectionHasMinimumNumberOfCards(
            topRowConstraints[i],
            sideRowConstraints[2],
            20
          ))
        ) {
          [topRowConstraints, sideRowConstraints] = this.rerollConstraints(
            topRowConstraints,
            i,
            sideRowConstraints,
            2,
            constraintDeck
          )
          break
        }

        if (i == 2) {
          allIntersectionsValidated = true
        }
      }
    }
    return [...topRowConstraints, ...sideRowConstraints]
  }

  static colorConstraintsMatch (topRowConstraints: GameConstraint[], sideRowConstraints: GameConstraint[]): boolean {
    const topRowColorContraint = topRowConstraints.filter(
      (constraint) => constraint.constraintType === ConstraintType.Color
    )[0]
    const sideRowColorConstraint = sideRowConstraints.filter(
      (constraint) => constraint.constraintType === ConstraintType.Color
    )[0]

    return (
      topRowColorContraint.displayName === sideRowColorConstraint.displayName
    )
  }

  static rerollConstraints (
    topRowConstraints: GameConstraint[],
    topIndex: number,
    sideRowConstraints: GameConstraint[],
    sideIndex: number,
    constraintDeck: GameConstraint[]
  ) {
    sideRowConstraints[sideIndex] = this.selectRandomConstraintOfType(
      constraintDeck,
      sideRowConstraints[sideIndex].constraintType
    )
    topRowConstraints[topIndex] = this.selectRandomConstraintOfType(
      constraintDeck,
      topRowConstraints[topIndex].constraintType
    )

    const topRowColorContraint = topRowConstraints.filter(
      (constraint) => constraint.constraintType === ConstraintType.Color
    )[0]
    let sideRowColorConstraint = sideRowConstraints.filter(
      (constraint) => constraint.constraintType === ConstraintType.Color
    )[0]

    while (
      topRowColorContraint.displayName === sideRowColorConstraint.displayName
    ) {
      const replacementIndex = sideRowConstraints.indexOf(sideRowColorConstraint)
      sideRowColorConstraint = this.selectRandomConstraintOfType(constraintDeck, ConstraintType.Color)
      sideRowConstraints[replacementIndex] = sideRowColorConstraint
    }

    return [topRowConstraints, sideRowConstraints]
  }

  static async intersectionHasMinimumNumberOfCards (
    gameConstraintOne: GameConstraint,
    gameConstraintTwo: GameConstraint,
    minimumCardCount: number
  ): Promise<boolean> {
    const query = `${gameConstraintOne.scryfallQuery} ${gameConstraintTwo.scryfallQuery}`
    const cardCount = await ScryfallService.getFirstPageCardCount(query)
    return (
      cardCount >= minimumCardCount
    )
  }

  static getColorConstraints (constraintDeck: GameConstraint[]) {
    const topRowColorConstraint = this.selectRandomConstraintOfType(
      constraintDeck,
      ConstraintType.Color
    )
    let bottomRowColorConstraint = this.selectRandomConstraintOfType(
      constraintDeck,
      ConstraintType.Color
    )
    while (
      topRowColorConstraint.displayName === bottomRowColorConstraint.displayName
    ) {
      bottomRowColorConstraint = this.selectRandomConstraintOfType(
        constraintDeck,
        ConstraintType.Color
      )
    }

    return [topRowColorConstraint, bottomRowColorConstraint]
  }

  static getGameConstraintsForIndex (gameConstraints: GameConstraint[], squareIndex: number) {
    let intersectingConstraints: GameConstraint[] = []
    const topRow = gameConstraints.slice(0, 3)
    const bottomRow = gameConstraints.slice(3)

    switch (squareIndex) {
      case 0:
        intersectingConstraints = [topRow[0], bottomRow[0]]
        break
      case 1:
        intersectingConstraints = [topRow[1], bottomRow[0]]
        break
      case 2:
        intersectingConstraints = [topRow[2], bottomRow[0]]
        break
      case 3:
        intersectingConstraints = [topRow[0], bottomRow[1]]
        break
      case 4:
        intersectingConstraints = [topRow[1], bottomRow[1]]
        break
      case 5:
        intersectingConstraints = [topRow[2], bottomRow[1]]
        break
      case 6:
        intersectingConstraints = [topRow[0], bottomRow[2]]
        break
      case 7:
        intersectingConstraints = [topRow[1], bottomRow[2]]
        break
      case 8:
        intersectingConstraints = [topRow[2], bottomRow[2]]
        break
    }

    return intersectingConstraints
  }

  static selectRandomConstraintOfType (
    constraintDeck: GameConstraint[],
    type: ConstraintType
  ) {
    return this.shuffleArray(
      constraintDeck.filter((constraint) => constraint.constraintType === type)
    )[0]
  }

  static async createConstraintDeck (): Promise<GameConstraint[]> {
    const setConstraints = await ScryfallService.getSetConstraints()

    return this.shuffleArray([
      ...setConstraints,
      ...colorConstraints,
      ...manaValueConstraints,
      ...rarityConstraints,
      ...typeConstraints
    ])
  }

  static shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
    return array
  }

  static addDays (dateToAddTo: Date, days: number): Date {
    const date = new Date(dateToAddTo.valueOf())
    date.setDate(date.getDate() + days)
    return date
  }

  static getTodaysDateString (dayOffset: number = 0): string {
    let now = new Date()
    now = this.addDays(now, dayOffset)
    return `${now.getFullYear()}${now
      .getMonth()
      .toString()
      .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`
  }
}

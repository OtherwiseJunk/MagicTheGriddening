/* eslint-disable @typescript-eslint/no-extraneous-class */
import { type GameConstraint } from '@/models/UI/gameConstraint'

export default class GriddeningService {

  static getGameConstraintsForIndex (gameConstraints: GameConstraint[], squareIndex: number): GameConstraint[] {
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

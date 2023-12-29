import { type GameConstraint } from '@/models/UI/gameConstraint'

import GriddeningService from '@/services/griddening.service'
import DataService from '@/services/data.service'

export async function GET (request: Request, { params }: { params: { days: string } }) {
  await (async () => {
    const latestGame = await DataService.getNewestGame()
    let startingOffset = 0
    if (latestGame) {
      const dateOne = latestGame.dateStringToDate()
      const dateTwo = new Date()
      dateTwo.setHours(0, 0, 0, 0)
      startingOffset = Math.round(Math.abs(dateOne.getTime() - dateTwo.getTime()) / (1000 * 3600 * 24)) + 1
    }
    const targetDayWithOffset = parseInt(params.days) + startingOffset
    for (let daysOffset = startingOffset; daysOffset < targetDayWithOffset; daysOffset++) {
      const constraintDeck = await GriddeningService.createConstraintDeck()
      console.log(`Creating day ${daysOffset + 1} puzzle`)
      const t0 = performance.now()
      const validGameConstraints = await GriddeningService.selectValidConstraints(constraintDeck.map((constraint: GameConstraint) => constraint))
      const t1 = performance.now()
      console.log(`took ${(t1 - t0) / 1000} seconds.`)

      await DataService.createNewGame(GriddeningService.getTodaysDateString(daysOffset), validGameConstraints)
    }
  })()
  return new Response()
}

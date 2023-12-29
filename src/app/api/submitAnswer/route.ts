import { type GameConstraint } from '@/models/UI/gameConstraint'
import DataService from '@/services/data.service'
import GriddeningService from '@/services/griddening.service'
import ScryfallService from '@/services/scryfall.service'
import { type PlayerRecord } from '@prisma/client'

interface SubmitRequest {
  playerId: string
  squareIndex: number
  guess: string
}

export async function POST (request: Request) {
  const args = await request.json() as SubmitRequest
  const game = await DataService.getTodaysGame()
  const constraints = JSON.parse(game!.constraintsJSON) as GameConstraint[]
  const [constraintOne, constraintTwo] = GriddeningService.getGameConstraintsForIndex(constraints, args.squareIndex)
  const query = `${args.guess} ${constraintOne.scryfallQuery} ${constraintTwo.scryfallQuery}`
  const cards = await ScryfallService.getCards(query)
  const player: PlayerRecord = await DataService.getPlayerRecord(args.playerId, game!.id)
  const card = cards.find((card) => card.name === args.guess)

  if (card) {
    const imageUrl = card.image_uris ? card.image_uris.png : card.card_faces[0].image_uris!.png
    await DataService.createCorrectGuess(player.id, game!.id, args.squareIndex, card.name, imageUrl)
    await DataService.updatePlayerLifeValue(player.id, player.lifePoints - 1)
    return new Response('Ok')
  }

  await DataService.updatePlayerLifeValue(player.id, player.lifePoints - 1)
  return new Response('Not Implemented', { status: 504 })
}

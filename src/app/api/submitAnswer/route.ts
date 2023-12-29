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

export async function POST (request: Request):Promise<Response> {
  const args = await request.json() as SubmitRequest
  const game = await DataService.getTodaysGame()
  if(game === undefined) return new Response('Game Not Found', { status: 500 });

  const constraints = JSON.parse(game.constraintsJSON) as GameConstraint[]
  const [constraintOne, constraintTwo] = GriddeningService.getGameConstraintsForIndex(constraints, args.squareIndex)
  const query = `${args.guess} ${constraintOne.scryfallQuery} ${constraintTwo.scryfallQuery}`
  const cards = await ScryfallService.getCards(query)
  const player: PlayerRecord = await DataService.getPlayerRecord(args.playerId, game.id)
  const card = cards.find((card) => card.name === args.guess)

  if (card === undefined) {
    await DataService.updatePlayerLifeValue(player.id, player.lifePoints - 1)
    return new Response('Not Implemented', { status: 504 })
  }

    const imageUrl = (card.image_uris !== undefined && card.image_uris != null) ? card.image_uris.png : card.card_faces[0].image_uris?.png
    await DataService.createCorrectGuess(player.id, game.id, args.squareIndex, card.name, imageUrl ?? './card-not-found.png')
    await DataService.updatePlayerLifeValue(player.id, player.lifePoints - 1)
    return new Response('Ok')
}

import { type GameConstraint } from "@/models/UI/gameConstraint";
import DataService from "@/services/data.service";
import GriddeningService from "@/services/griddening.service";
import ScryfallService from "@/services/scryfall.service";
import { type PlayerRecord } from "@prisma/client";

interface SubmitRequest {
  playerId: string;
  squareIndex: number;
  guess: string;
}

function jsonResponse(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const args = (await request.json()) as SubmitRequest;
    const game = await DataService.getTodaysGame();
    if (game === undefined) {
      return new Response("Game Not Found", {
        status: 404,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" },
      });
    }

    const constraints = JSON.parse(game.constraintsJSON) as GameConstraint[];
    const [constraintOne, constraintTwo] = GriddeningService.getGameConstraintsForIndex(
      constraints,
      args.squareIndex,
    );
    const query = `${args.guess} ${constraintOne.scryfallQuery} ${constraintTwo.scryfallQuery}`;
    const cards = await ScryfallService.getCards(query);
    const player: PlayerRecord = await DataService.getPlayerRecord(args.playerId, game.id);
    const card = cards.find((card) => card.name === args.guess);

    if (card === undefined) {
      const nextLifePoints = player.lifePoints - 1;
      await DataService.updatePlayerLifeValue(player.id, nextLifePoints);
      return jsonResponse({ outcome: "incorrect", lifePoints: nextLifePoints }, 422);
    }

    const existingGuesses = await DataService.getCorrectGuessesForPlayer(player.id, game.id);
    if (existingGuesses.some((guess) => guess.correctGuess === card.name)) {
      return jsonResponse({ outcome: "duplicate" }, 409);
    }

    const imageUrl =
      card.image_uris !== undefined && card.image_uris != null
        ? card.image_uris.png
        : card.card_faces?.[0]?.image_uris?.png;
    const nextLifePoints = player.lifePoints - 1;
    await DataService.createCorrectGuess(
      player.id,
      game.id,
      args.squareIndex,
      card.name,
      imageUrl ?? "/card-not-found.png",
    );
    await DataService.updatePlayerLifeValue(player.id, nextLifePoints);
    return jsonResponse(
      {
        outcome: "correct",
        lifePoints: nextLifePoints,
        correctGuess: {
          cardName: card.name,
          imageUrl: imageUrl ?? "/card-not-found.png",
          squareIndex: args.squareIndex,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Error processing guess submission:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" },
    });
  }
}

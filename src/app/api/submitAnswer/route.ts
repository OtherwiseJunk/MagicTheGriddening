import { type GameConstraint } from "@/models/UI/gameConstraint";
import DataService from "@/services/data.service";
import GriddeningService from "@/services/griddening.service";
import CardValidationService from "@/services/card-validation.service";
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

    const card = await CardValidationService.findCard(args.guess);
    const player: PlayerRecord = await DataService.getPlayerRecord(args.playerId, game.id);

    if (
      card === undefined ||
      !CardValidationService.matchesAllConstraints(card, [constraintOne, constraintTwo])
    ) {
      const nextLifePoints = player.lifePoints - 1;
      await DataService.updatePlayerLifeValue(player.id, nextLifePoints);
      return jsonResponse({ outcome: "incorrect", lifePoints: nextLifePoints }, 422);
    }

    const existingGuesses = await DataService.getCorrectGuessesForPlayer(player.id, game.id);
    if (existingGuesses.some((guess) => guess.correctGuess === card.name)) {
      return jsonResponse({ outcome: "duplicate" }, 409);
    }

    const nextLifePoints = player.lifePoints - 1;
    await DataService.createCorrectGuess(
      player.id,
      game.id,
      args.squareIndex,
      card.name,
      card.imagePng,
    );
    await DataService.updatePlayerLifeValue(player.id, nextLifePoints);
    return jsonResponse(
      {
        outcome: "correct",
        lifePoints: nextLifePoints,
        correctGuess: {
          cardName: card.name,
          imageUrl: card.imagePng,
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

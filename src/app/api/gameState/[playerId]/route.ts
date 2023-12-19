import { GameState } from "@/app/models/UI/gameState";
import { GameConstraint } from "@/app/models/UI/gameConstraint";
import { PrismaClient } from "@prisma/client";
import { Game } from "@/app/models/Database/game";
import { CorrectGuess } from "@/app/models/Database/correctGuess";

const prisma = new PrismaClient();
const hardcodedConstraints: GameConstraint[] = [
    new GameConstraint("Sorcery"),
    new GameConstraint(
        "Black",
        "swamp.png",
        "A black mana symbol; a poorly drawn skull sillouhete on a dark gray field."
    ),
    new GameConstraint(
        "Red",
        "mountain.png",
        "A red mana symbol; a poorly drawn fireball sillouhete on a red field."
    ),
    new GameConstraint(
        "Green",
        "forest.png",
        "A green mana symbol; a poorly drawn tree sillouhete on a green field."
    ),
    new GameConstraint(
        "Blue",
        "island.png",
        "A blue mana symbol; a poorly drawn water droplet sillouhete on a blue field."
    ),
    new GameConstraint(
        "White",
        "plains.png",
        "A white mana symbol; a poorly drawn sun sillouhete on a pale yellow field."
    ),
];

export async function GET(request: Request, { params }: { params: { playerId: string } }) {
    return new Response(JSON.stringify(await buildGameStateForUser(params.playerId)))
}

async function buildGameStateForUser(playerId: string): Promise<GameState> {
    const [gameConstraints, gameId] = await getGameData();
    const [lifePoints, correctGuesses] = await getUserDataForGame(playerId, gameId);
    const gameState = new GameState(gameConstraints, lifePoints, correctGuesses);
    return gameState;
}

async function getGameData(): Promise<[GameConstraint[], number]> {
    let game = await getTodaysGame();
    if (!game) {
        console.log("Generating a new game for today.");
        await createNewGame();
        game = await getTodaysGame();
    }
    game = new Game(game!.id, game!.day, game!.constraintsJSON)
    console.log(Object.keys(game));

    return [game.toUIObject(), game!.id]
}

async function getUserDataForGame(playerId: string, gameId: number): Promise<[number, { cardName: string, imageUrl: string, squareIndex: number }[]]> {
    let lifePoints: number = 9;
    let correctGuesses: { cardName: string, imageUrl: string, squareIndex: number }[] = [];

    const playerRecord = await prisma.playerRecord.findFirst({
        where: {
            playerId: playerId,
            gameId: gameId,
        },
        include: {
            correctGuesses: true
        }
    });

    if (playerRecord) {
        lifePoints = playerRecord.lifePoints;
        let correctGameGuesses: CorrectGuess[] = (playerRecord.correctGuesses
            .filter((correctGuess) => correctGuess.gameId === gameId) as CorrectGuess[])
        if (correctGameGuesses.length) {
            correctGuesses = correctGameGuesses.map((correctGuess: CorrectGuess) => correctGuess.toUIObject())
        }
    }

    return [lifePoints, correctGuesses]
}

function getTodaysDateString(): string {
    let now = new Date();
    console.log(now)
    console.log(`year: ${now.getFullYear()}, month: ${now.getMonth()}, day: ${now.getDate()}`)
    return `${now.getFullYear()}${now.getMonth()}${now.getDate()}`;
}

async function getTodaysGame(): Promise<Game | null> {
    return await prisma.game.findFirst({
        where: {
            day: getTodaysDateString(),
        },
    }) as Game;
}

async function createNewGame(): Promise<void> {
    await prisma.game.create({
        data: {
            day: getTodaysDateString(),
            constraintsJSON: JSON.stringify(hardcodedConstraints),
        },
    });
}

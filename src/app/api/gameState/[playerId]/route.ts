import { GameState } from "@/models/UI/gameState";
import { ConstraintType, GameConstraint } from "@/models/UI/gameConstraint";
import * as Scry from "scryfall-sdk";
import { PrismaClient } from "@prisma/client";
import { Game } from "@/models/Database/game";
import { CorrectGuess } from "@/models/Database/correctGuess";
import {
  colorConstraints,
  manaValueConstraints,
  rarityConstraints,
  typeConstraints,
} from "@/constants/constraintConstants";
import { colorToColorCode, rarityToRarityCode } from "@/constants/scryfallConstants";

const prisma = new PrismaClient();
const hardcodedConstraints: GameConstraint[] = [
  new GameConstraint("Sorcery", ConstraintType.Type),
];

export async function GET(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  return new Response(
    JSON.stringify(await buildGameStateForUser(params.playerId))
  );
}

async function buildGameStateForUser(playerId: string): Promise<GameState> {
  const [gameConstraints, gameId] = await getGameData();
  const [lifePoints, correctGuesses] = await getUserDataForGame(
    playerId,
    gameId
  );
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
  game = new Game(game!.id, game!.day, game!.constraintsJSON);
  console.log(Object.keys(game));

  return [game.toUIObject(), game!.id];
}

async function getUserDataForGame(
  playerId: string,
  gameId: number
): Promise<
  [number, { cardName: string; imageUrl: string; squareIndex: number }[]]
> {
  let lifePoints: number = 9;
  let correctGuesses: {
    cardName: string;
    imageUrl: string;
    squareIndex: number;
  }[] = [];

  const playerRecord = await prisma.playerRecord.findFirst({
    where: {
      playerId: playerId,
      gameId: gameId,
    },
    include: {
      correctGuesses: true,
    },
  });

  if (playerRecord) {
    lifePoints = playerRecord.lifePoints;
    let correctGameGuesses: CorrectGuess[] = playerRecord.correctGuesses.filter(
      (correctGuess) => correctGuess.gameId === gameId
    ) as CorrectGuess[];
    if (correctGameGuesses.length) {
      correctGuesses = correctGameGuesses.map((correctGuess: CorrectGuess) =>
        correctGuess.toUIObject()
      );
    }
  }

  return [lifePoints, correctGuesses];
}

function getTodaysDateString(): string {
  let now = new Date();
  console.log(now);
  console.log(
    `year: ${now.getFullYear()}, month: ${now.getMonth()}, day: ${now.getDate()}`
  );
  return `${now.getFullYear()}${now.getMonth()}${now.getDate()}`;
}

async function getTodaysGame(): Promise<Game | null> {
  return (await prisma.game.findFirst({
    where: {
      day: getTodaysDateString(),
    },
  })) as Game;
}

async function createNewGame(): Promise<void> {
  const constraintDeck = await createConstraintDeck();
  const validGameConstraints = await selectValidConstraints(constraintDeck);
  await prisma.game.create({
    data: {
      day: getTodaysDateString(),
      constraintsJSON: JSON.stringify(validGameConstraints),
    },
  });
}

async function selectValidConstraints(
  constraintDeck: GameConstraint[]
): Promise<GameConstraint[]> {
  let solitaryConstraintTypes = [
    ConstraintType.ManaValue,
    ConstraintType.Rarity,
    ConstraintType.Set,
    ConstraintType.Type,
  ];
  let [topRowColorConstraint, bottomRowColorConstraint] =
    getColorConstraints(constraintDeck);
  let topRowConstraints: GameConstraint[] = [topRowColorConstraint];
  let sideRowConstraints: GameConstraint[] = [bottomRowColorConstraint];

  shuffleArray(solitaryConstraintTypes).forEach((constraintType, index) => {
    if (index < 2) {
      topRowConstraints.push(
        selectRandomConstraintOfType(constraintDeck, constraintType)
      );
    } else {
      sideRowConstraints.push(
        selectRandomConstraintOfType(constraintDeck, constraintType)
      );
    }
  });

  topRowConstraints = shuffleArray(topRowConstraints)
  sideRowConstraints = shuffleArray(sideRowConstraints);

  
  return replaceInvalidConstraints(topRowConstraints, sideRowConstraints)
}

function replaceInvalidConstraints(
  topRowConstraints: GameConstraint[],
  sideRowConstraints: GameConstraint[]
): GameConstraint[] {
  let allIntersectionsValidated = false;
  while (!allIntersectionsValidated) {
    for (let i = 0; i < topRowConstraints.length; i++) {
        allIntersectionsValidated = true;
    }
  }
  topRowConstraints = topRowConstraints.map(removeSetCodeFromSetConstraint)
  sideRowConstraints = sideRowConstraints.map(removeSetCodeFromSetConstraint)
  return [...topRowConstraints, ...sideRowConstraints]
}

function removeSetCodeFromSetConstraint(constraint: GameConstraint): GameConstraint{
    if(constraint.constraintType === ConstraintType.Set){
        constraint.displayName = constraint.displayName.split('-')[0].trim();
    }

    return constraint;
}

function intersectionHasMinimumNumberOfCards(
  gameConstraintOne: GameConstraint,
  gameConstraintTwo: GameConstraint,
  minimumCardCount: number
) {}

function getColorConstraints(
  constraintDeck: GameConstraint[]
): GameConstraint[] {
  let topRowColorConstraint = selectRandomConstraintOfType(
    constraintDeck,
    ConstraintType.Color
  );
  let bottomRowColorConstraint = selectRandomConstraintOfType(
    constraintDeck,
    ConstraintType.Color
  );
  while (
    topRowColorConstraint.displayName === bottomRowColorConstraint.displayName
  ) {
    bottomRowColorConstraint = selectRandomConstraintOfType(
      constraintDeck,
      ConstraintType.Color
    );
  }

  return [topRowColorConstraint, bottomRowColorConstraint];
}

function selectRandomConstraintOfType(
  constraintDeck: GameConstraint[],
  type: ConstraintType
) {
  return shuffleArray(
    constraintDeck.filter((constraint) => constraint.constraintType === type)
  )[0];
}

function getScryfallQueryForConstraint(constraint: GameConstraint): string {
  switch (constraint.constraintType) {
    case ConstraintType.Color:
      return `c:${colorToColorCode.get(constraint.displayName)}`;
    case ConstraintType.ManaValue:
      return `cmc:${parseInt(constraint.displayName)}`;
    case ConstraintType.Set:
      return `set:${constraint.displayName.split('-')[1].trim()}`;
    case ConstraintType.Rarity:
      return `r:${rarityToRarityCode.get(constraint.displayName)}`;
    case ConstraintType.Type:
      return `type:${constraint.displayName}`;
  }
}

async function createConstraintDeck(): Promise<GameConstraint[]> {
  const setConstraints: GameConstraint[] = [
    new GameConstraint("Fallout", ConstraintType.Set),
    new GameConstraint("Doctor Who", ConstraintType.Set),
    new GameConstraint("Warhammer 40,000 Commander - 40k", ConstraintType.Set),
    new GameConstraint("Fallout", ConstraintType.Set),
  ];

  (await Scry.Sets.all()).forEach((set) => {
    if (["core", "expansion"].includes(set.set_type)) {
      setConstraints.push(
        new GameConstraint(`${set.name} - ${set.code}`, ConstraintType.Set)
      );
    }
  });

  return shuffleArray<GameConstraint>([
    ...setConstraints,
    ...colorConstraints,
    ...manaValueConstraints,
    ...rarityConstraints,
    ...typeConstraints,
  ] as GameConstraint[]);
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

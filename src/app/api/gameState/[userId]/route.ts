import { GameState } from "@/app/models/gameState";
import { GameConstraint } from "@/app/models/headerSquareInfo";
import { useRouter } from "next/router";

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

export async function GET(request: Request, { params }: { params: { userId: string } }) {
    let dateString = getDateString();
    console.log(`${dateString} - ${params.userId}`)
    return new Response(JSON.stringify(new GameState(hardcodedConstraints, 9, [])))
}

function getDateString() {
    let now = new Date();
    console.log(now)
    console.log(`year: ${now.getFullYear()}, month: ${now.getMonth()}, day: ${now.getDate()}`)
    return `${now.getFullYear()}${now.getMonth()}${now.getDate()}`;
}

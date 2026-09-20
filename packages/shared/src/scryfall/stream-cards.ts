import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { type ScryfallBulkCard } from "./types";

export async function streamCards(
  filePath: string,
  fn: (card: ScryfallBulkCard) => void,
): Promise<void> {
  const lines = createInterface({
    input: createReadStream(filePath).pipe(createGunzip()),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const card = JSON.parse(line) as ScryfallBulkCard;
    if (card.games?.includes("paper") ?? false) fn(card);
  }
}

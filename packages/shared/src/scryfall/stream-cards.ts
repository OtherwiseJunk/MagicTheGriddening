import { createReadStream } from "node:fs";
import { streamArray } from "stream-json/streamers/stream-array.js";
import { type ScryfallBulkCard } from "./types";

export async function streamCards(
  filePath: string,
  fn: (card: ScryfallBulkCard) => void,
): Promise<void> {
  const stream = streamArray.withParserAsStream();
  const rs = createReadStream(filePath);
  rs.on("error", (e) => stream.destroy(e));
  rs.pipe(stream);
  for await (const item of stream) {
    const card = (item as { key: number; value: ScryfallBulkCard }).value;
    if (card.games?.includes("paper") ?? false) fn(card);
  }
}

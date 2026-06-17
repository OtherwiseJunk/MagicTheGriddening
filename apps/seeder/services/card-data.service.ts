import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  type LocalCard,
  type LocalSet,
  type CardIndexFile,
  buildCardIndex,
  fetchBulkDataFile,
  downloadBulkDataFile,
  BULK_DATA_TYPE,
} from "@griddening/shared";

function getDataDirectory(): string {
  return process.env.BULK_DATA_DIR ?? path.join(process.cwd(), "data");
}

function logMemory(label: string): void {
  const { heapUsed, heapTotal, rss } = process.memoryUsage();
  const mb = (n: number) => `${Math.round(n / 1024 / 1024)}MB`;
  console.log(`[mem] ${label}: heap ${mb(heapUsed)}/${mb(heapTotal)}, rss ${mb(rss)}`);
}

type CardDataCache = { cards: LocalCard[]; sets: LocalSet[] };

export class CardDataService {
  private initPromise: Promise<CardDataCache> | null = null;

  async getSets(): Promise<LocalSet[]> {
    return (await this.init()).sets;
  }

  async getCards(): Promise<LocalCard[]> {
    return (await this.init()).cards;
  }

  private async init(): Promise<CardDataCache> {
    if (!this.initPromise) {
      this.initPromise = this.loadOrDownload();
    }
    return this.initPromise;
  }

  private async loadOrDownload(): Promise<CardDataCache> {
    const dataDir = getDataDirectory();
    const indexPath = path.join(dataDir, "card-index.json");

    await mkdir(dataDir, { recursive: true });

    try {
      const stored = JSON.parse(await readFile(indexPath, "utf8")) as CardIndexFile;
      const sets = stored.sets ?? this.setsFromCards(stored.cards);
      console.log(`Loaded ${stored.cards.length} cards from disk (${indexPath})`);
      return { cards: stored.cards, sets };
    } catch {
      console.log("card-index.json not found — downloading from Scryfall...");
    }

    return this.downloadAndSave(dataDir, indexPath);
  }

  private setsFromCards(cards: LocalCard[]): LocalSet[] {
    const setMap = new Map<string, LocalSet>();
    for (const card of cards) {
      if (!setMap.has(card.set)) {
        setMap.set(card.set, {
          code: card.set,
          name: card.set_name,
          set_type: card.set_type,
          released_at: card.released_at,
        });
      }
    }
    return Array.from(setMap.values());
  }

  private async downloadAndSave(dataDir: string, indexPath: string): Promise<CardDataCache> {
    const bulkDataFile = await fetchBulkDataFile(BULK_DATA_TYPE);
    const tempBulkPath = path.join(dataDir, `bulk-${randomUUID()}.json`);
    const tempIndexPath = path.join(dataDir, `index-${randomUUID()}.json`);

    try {
      logMemory("pre-download");
      await downloadBulkDataFile(bulkDataFile.download_uri, tempBulkPath);
      logMemory("post-download");
      const { cards, sets } = await buildCardIndex(tempBulkPath);
      logMemory("post-buildCardIndex");
      const indexFile: CardIndexFile = {
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: bulkDataFile.updated_at,
        cards,
        sets,
      };
      logMemory("pre-stringify");
      const json = JSON.stringify(indexFile);
      logMemory(`post-stringify (${Math.round(json.length / 1024 / 1024)}MB json)`);
      await writeFile(tempIndexPath, json, "utf8");
      await rename(tempIndexPath, indexPath);
      console.log(`Downloaded and saved ${cards.length} cards to ${indexPath}`);
      return { cards, sets };
    } finally {
      await rm(tempBulkPath, { force: true }).catch(() => undefined);
      await rm(tempIndexPath, { force: true }).catch(() => undefined);
    }
  }
}

// src/services/bulk-data.service.ts
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { type CardIndexFile, type LocalCard, buildLocalCards } from "@/models/local-card";

interface ScryfallBulkDataManifest {
  data: ScryfallBulkDataFile[];
}

interface ScryfallBulkDataFile {
  type: string;
  updated_at: string;
  download_uri: string;
}

const BULK_DATA_TYPE = "oracle_cards";
const DEFAULT_REFRESH_INTERVAL_HOURS = 24;
const SCRYFALL_API_URL = "https://api.scryfall.com/bulk-data";
const SCRYFALL_USER_AGENT =
  "magic-the-griddening/0.1 (+https://github.com/otherwisejunk/MagicTheGriddening)";
const DATA_DIRECTORY =
  process.env.BULK_DATA_DIR ??
  process.env.AUTOCOMPLETE_DATA_DIR ??
  path.join(process.cwd(), "data");
const RAW_BULK_FILE_PATH = path.join(DATA_DIRECTORY, "scryfall-oracle-cards.json");
const INDEX_FILE_PATH = path.join(DATA_DIRECTORY, "card-index.json");
const REFRESH_INTERVAL_MS =
  Number(
    process.env.BULK_DATA_REFRESH_INTERVAL_HOURS ??
      process.env.AUTOCOMPLETE_REFRESH_INTERVAL_HOURS ??
      DEFAULT_REFRESH_INTERVAL_HOURS,
  ) *
  60 *
  60 *
  1000;

class BulkDataService {
  private readonly initPromise: Promise<void>;
  private refreshPromise: Promise<void> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private sourceUpdatedAt = "";
  private cards: LocalCard[] = [];
  private cardMap: Map<string, LocalCard> = new Map();

  constructor() {
    this.initPromise = this.initialize();
  }

  async getCards(): Promise<LocalCard[]> {
    await this.initPromise;
    return this.cards;
  }

  async findCard(name: string): Promise<LocalCard | undefined> {
    await this.initPromise;
    return this.cardMap.get(name);
  }

  private async initialize(): Promise<void> {
    await this.loadIndexFromDisk();
    this.ensureRefreshTimer();
    if (this.cards.length === 0) {
      await this.refreshIndex();
    }
  }

  private async loadIndexFromDisk(): Promise<void> {
    await mkdir(DATA_DIRECTORY, { recursive: true });
    try {
      const stored = JSON.parse(await readFile(INDEX_FILE_PATH, "utf8")) as CardIndexFile;
      this.setIndex(stored);
    } catch {
      this.cards = [];
      this.sourceUpdatedAt = "";
    }
  }

  private ensureRefreshTimer(): void {
    if (
      this.refreshTimer !== null ||
      !Number.isFinite(REFRESH_INTERVAL_MS) ||
      REFRESH_INTERVAL_MS <= 0
    ) {
      return;
    }
    this.refreshTimer = setInterval(() => {
      void this.refreshIndex().catch((error: unknown) => {
        console.error("Error refreshing card index:", error);
      });
    }, REFRESH_INTERVAL_MS);
    this.refreshTimer.unref?.();
  }

  private async refreshIndex(): Promise<void> {
    if (this.refreshPromise !== null) {
      await this.refreshPromise;
      return;
    }
    this.refreshPromise = this.performRefresh().finally(() => {
      this.refreshPromise = null;
    });
    await this.refreshPromise;
  }

  private async performRefresh(): Promise<void> {
    await mkdir(DATA_DIRECTORY, { recursive: true });
    const bulkDataFile = await this.fetchBulkDataFile();
    if (bulkDataFile.updated_at === this.sourceUpdatedAt && this.cards.length > 0) {
      return;
    }
    const tempBulkFilePath = path.join(DATA_DIRECTORY, `bulk-${randomUUID()}.json`);
    const tempIndexFilePath = path.join(DATA_DIRECTORY, `index-${randomUUID()}.json`);
    try {
      await this.downloadBulkDataFile(bulkDataFile.download_uri, tempBulkFilePath);
      const rawCards = JSON.parse(await readFile(tempBulkFilePath, "utf8")) as unknown[];
      const nextIndex: CardIndexFile = {
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: bulkDataFile.updated_at,
        cards: buildLocalCards(rawCards as Parameters<typeof buildLocalCards>[0]),
      };
      await writeFile(tempIndexFilePath, JSON.stringify(nextIndex), "utf8");
      await rename(tempBulkFilePath, RAW_BULK_FILE_PATH);
      await rename(tempIndexFilePath, INDEX_FILE_PATH);
      this.setIndex(nextIndex);
    } finally {
      await rm(tempBulkFilePath, { force: true }).catch(() => undefined);
      await rm(tempIndexFilePath, { force: true }).catch(() => undefined);
    }
  }

  private setIndex(index: CardIndexFile): void {
    this.sourceUpdatedAt = index.sourceUpdatedAt;
    this.cards = index.cards;
    this.cardMap = new Map();
    for (const card of index.cards) {
      this.cardMap.set(card.name, card);
      for (const faceName of card.faceNames) {
        this.cardMap.set(faceName, card);
      }
    }
  }

  private async fetchBulkDataFile(): Promise<ScryfallBulkDataFile> {
    const response = await fetch(SCRYFALL_API_URL, {
      headers: { Accept: "application/json;q=0.9,*/*;q=0.8", "User-Agent": SCRYFALL_USER_AGENT },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Unable to fetch Scryfall bulk data manifest (${response.status})`);
    }
    const manifest = (await response.json()) as ScryfallBulkDataManifest;
    const bulkDataFile = manifest.data.find((entry) => entry.type === BULK_DATA_TYPE);
    if (bulkDataFile === undefined) {
      throw new Error(`Unable to find ${BULK_DATA_TYPE} in the Scryfall bulk data manifest`);
    }
    return bulkDataFile;
  }

  private async downloadBulkDataFile(downloadUri: string, destinationPath: string): Promise<void> {
    const response = await fetch(downloadUri, {
      headers: { Accept: "application/json;q=0.9,*/*;q=0.8", "User-Agent": SCRYFALL_USER_AGENT },
      cache: "no-store",
    });
    if (!response.ok || response.body === null) {
      throw new Error(`Unable to download Scryfall bulk data file (${response.status})`);
    }
    await writeFile(destinationPath, new Uint8Array(await response.arrayBuffer()));
  }
}

export default new BulkDataService();

// src/services/bulk-data.service.ts
import { createReadStream } from "node:fs";
import { mkdir, open, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { streamArray } from "stream-json/streamers/stream-array.js";
import { type CardIndexFile, type LocalCard } from "@/models/local-card";

interface ScryfallBulkDataManifest {
  data: ScryfallBulkDataFile[];
}

interface ScryfallBulkDataFile {
  type: string;
  updated_at: string;
  download_uri: string;
}

interface ScryfallBulkFace {
  name?: string;
  colors?: string[];
  oracle_text?: string;
  artist?: string;
  power?: string;
  toughness?: string;
  image_uris?: { png: string };
}

interface ScryfallBulkCard {
  name: string;
  oracle_id?: string;
  type_line?: string;
  colors?: string[];
  color_identity?: string[];
  cmc?: number;
  rarity?: string;
  oracle_text?: string;
  artist?: string;
  power?: string;
  toughness?: string;
  set?: string;
  set_name?: string;
  set_type?: string;
  released_at?: string;
  image_uris?: { png: string };
  card_faces?: ScryfallBulkFace[];
  games?: string[];
}

interface CardAccumulator {
  name: string;
  faceNames: string[];
  type_line: string;
  colors: string[];
  cmc: number;
  oracle_text: string;
  power: string | undefined;
  toughness: string | undefined;
  set: string;
  set_name: string;
  set_type: string;
  released_at: string | undefined;
  imagePng: string;
  rarities: Set<string>;
  sets: Set<string>;
  artists: Set<string>;
}

const BULK_DATA_TYPE = "all_cards";
const DEFAULT_REFRESH_INTERVAL_HOURS = 24;
const SCRYFALL_API_URL = "https://api.scryfall.com/bulk-data";
const SCRYFALL_USER_AGENT =
  "magic-the-griddening/0.1 (+https://github.com/otherwisejunk/MagicTheGriddening)";
const DATA_DIRECTORY =
  process.env.BULK_DATA_DIR ??
  process.env.AUTOCOMPLETE_DATA_DIR ??
  path.join(process.cwd(), "data");
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
      const cards = await this.buildCardIndex(tempBulkFilePath);
      const nextIndex: CardIndexFile = {
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: bulkDataFile.updated_at,
        cards,
      };
      await writeFile(tempIndexFilePath, JSON.stringify(nextIndex), "utf8");
      await rename(tempIndexFilePath, INDEX_FILE_PATH);
      this.setIndex(nextIndex);
      console.log(`Refreshed card index: ${cards.length} cards`);
    } finally {
      await rm(tempBulkFilePath, { force: true }).catch(() => undefined);
      await rm(tempIndexFilePath, { force: true }).catch(() => undefined);
    }
  }

  private async buildCardIndex(filePath: string): Promise<LocalCard[]> {
    const groups = new Map<string, CardAccumulator>();

    const stream = streamArray.withParserAsStream();
    const rs = createReadStream(filePath);
    rs.on("error", (e) => stream.destroy(e));
    rs.pipe(stream);

    for await (const item of stream) {
      const card = (item as { key: number; value: ScryfallBulkCard }).value;
      if (!(card.games?.includes("paper") ?? false)) continue;

      const key = card.oracle_id ?? card.name;
      const existing = groups.get(key);
      if (existing) {
        if (card.rarity) existing.rarities.add(card.rarity);
        if (card.set) existing.sets.add(card.set);
        const artist = card.artist ?? card.card_faces?.[0]?.artist;
        if (artist) existing.artists.add(artist);
      } else {
        // Compute all derived fields eagerly so the raw card object can be GC'd
        const faces = card.card_faces ?? [];
        const faceColors =
          faces.length > 0 ? Array.from(new Set(faces.flatMap((f) => f.colors ?? []))) : undefined;
        const colors =
          card.colors !== undefined
            ? card.colors
            : faceColors !== undefined && faceColors.length > 0
              ? faceColors
              : (card.color_identity ?? []);
        const oracle_text =
          card.oracle_text ??
          faces
            .map((f) => f.oracle_text ?? "")
            .filter(Boolean)
            .join("\n");
        const imagePng =
          card.image_uris?.png ?? faces[0]?.image_uris?.png ?? "/card-not-found.png";
        const artist = card.artist ?? faces[0]?.artist;

        groups.set(key, {
          name: card.name,
          faceNames: faces.map((f) => f.name ?? "").filter(Boolean),
          type_line: card.type_line ?? "",
          colors,
          cmc: card.cmc ?? 0,
          oracle_text,
          power: card.power ?? faces[0]?.power,
          toughness: card.toughness ?? faces[0]?.toughness,
          set: card.set ?? "",
          set_name: card.set_name ?? "",
          set_type: card.set_type ?? "",
          released_at: card.released_at,
          imagePng,
          rarities: new Set(card.rarity ? [card.rarity] : []),
          sets: new Set(card.set ? [card.set] : []),
          artists: new Set(artist ? [artist] : []),
        });
      }
    }

    return Array.from(groups.values()).map(({ rarities, sets, artists, ...fixed }) => ({
      ...fixed,
      rarities: Array.from(rarities),
      sets: Array.from(sets),
      artists: Array.from(artists),
    }));
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
    const fh = await open(destinationPath, "w");
    try {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
        await fh.write(chunk);
      }
    } finally {
      await fh.close();
    }
  }
}

export default new BulkDataService();

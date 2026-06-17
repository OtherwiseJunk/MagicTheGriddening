import { createReadStream } from "node:fs";
import { mkdir, open, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { streamArray } from "stream-json/streamers/stream-array.js";
import { LocalCard } from "../types/LocalCard.js";
import { LocalSet } from "../types/LocalSet.js";

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

interface CardIndexFile {
  generatedAt: string;
  sourceUpdatedAt: string;
  cards: LocalCard[];
  sets?: LocalSet[];
}

const BULK_DATA_TYPE = "all_cards";
const SCRYFALL_API_URL = "https://api.scryfall.com/bulk-data";
const SCRYFALL_USER_AGENT =
  "magic-the-griddening/0.1 (+https://github.com/otherwisejunk/MagicTheGriddening)";

function getDataDirectory(): string {
  return process.env.BULK_DATA_DIR ?? path.join(process.cwd(), "data");
}

interface CardAccumulator {
  rarities: Set<string>;
  sets: Set<string>;
  artists: Set<string>;
}

async function streamCards(filePath: string, fn: (card: ScryfallBulkCard) => void): Promise<void> {
  const stream = streamArray.withParserAsStream();
  const rs = createReadStream(filePath);
  rs.on("error", (e) => stream.destroy(e));
  rs.pipe(stream);
  for await (const item of stream) {
    const card = (item as { key: number; value: ScryfallBulkCard }).value;
    if (card.games?.includes("paper") ?? false) fn(card);
  }
}

async function buildCardIndex(filePath: string): Promise<{ cards: LocalCard[]; sets: LocalSet[] }> {
  // Pass 1: accumulate only the tiny mutable parts (artist/set/rarity Sets) per oracle_id.
  // Keeping only these Sets instead of the full card object limits peak memory to ~50MB
  // regardless of how many printings exist in all_cards (~800k+ entries).
  const accumulated = new Map<string, CardAccumulator>();
  const setMap = new Map<string, LocalSet>();

  await streamCards(filePath, (card) => {
    if (card.set && !setMap.has(card.set)) {
      setMap.set(card.set, {
        code: card.set,
        name: card.set_name ?? "",
        set_type: card.set_type ?? "",
        released_at: card.released_at,
      });
    }
    const key = card.oracle_id ?? card.name;
    const existing = accumulated.get(key);
    if (existing) {
      if (card.rarity) existing.rarities.add(card.rarity);
      if (card.set) existing.sets.add(card.set);
      const artist = card.artist ?? card.card_faces?.[0]?.artist;
      if (artist) existing.artists.add(artist);
    } else {
      const artist = card.artist ?? card.card_faces?.[0]?.artist;
      accumulated.set(key, {
        rarities: new Set(card.rarity ? [card.rarity] : []),
        sets: new Set(card.set ? [card.set] : []),
        artists: new Set(artist ? [artist] : []),
      });
    }
  });

  // Pass 2: stream the file again; for the first occurrence of each oracle_id build the
  // full LocalCard by merging fixed fields from the card object with the accumulated Sets.
  // We delete each entry from accumulated as we process it to free memory incrementally.
  const cards: LocalCard[] = [];
  const processed = new Set<string>();

  await streamCards(filePath, (card) => {
    const key = card.oracle_id ?? card.name;
    if (processed.has(key)) return;
    processed.add(key);

    const acc = accumulated.get(key)!;
    accumulated.delete(key);

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
    const imagePng = card.image_uris?.png ?? faces[0]?.image_uris?.png ?? "/card-not-found.png";

    cards.push({
      name: card.name,
      faceNames: faces.map((f) => f.name ?? "").filter(Boolean),
      type_line: card.type_line ?? "",
      colors,
      cmc: card.cmc ?? 0,
      oracle_text,
      power: card.power ?? faces[0]?.power,
      toughness: card.toughness ?? faces[0]?.toughness,
      artists: Array.from(acc.artists),
      sets: Array.from(acc.sets),
      set: card.set ?? "",
      set_name: card.set_name ?? "",
      set_type: card.set_type ?? "",
      released_at: card.released_at,
      imagePng,
    });
  });

  return { cards, sets: Array.from(setMap.values()) };
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
    const bulkDataFile = await this.fetchBulkDataFile();
    const tempBulkPath = path.join(dataDir, `bulk-${randomUUID()}.json`);
    const tempIndexPath = path.join(dataDir, `index-${randomUUID()}.json`);

    try {
      await this.downloadBulkDataFile(bulkDataFile.download_uri, tempBulkPath);
      const { cards, sets } = await buildCardIndex(tempBulkPath);
      const indexFile: CardIndexFile = {
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: bulkDataFile.updated_at,
        cards,
        sets,
      };
      await writeFile(tempIndexPath, JSON.stringify(indexFile), "utf8");
      await rename(tempIndexPath, indexPath);
      console.log(`Downloaded and saved ${cards.length} cards to ${indexPath}`);
      return { cards, sets };
    } finally {
      await rm(tempBulkPath, { force: true }).catch(() => undefined);
      await rm(tempIndexPath, { force: true }).catch(() => undefined);
    }
  }

  private async fetchBulkDataFile(): Promise<ScryfallBulkDataFile> {
    const response = await fetch(SCRYFALL_API_URL, {
      headers: { Accept: "application/json;q=0.9,*/*;q=0.8", "User-Agent": SCRYFALL_USER_AGENT },
    });
    if (!response.ok) {
      throw new Error(`Unable to fetch Scryfall bulk data manifest (${response.status})`);
    }
    const manifest = (await response.json()) as ScryfallBulkDataManifest;
    const bulkDataFile = manifest.data.find((entry) => entry.type === BULK_DATA_TYPE);
    if (!bulkDataFile) {
      throw new Error(`Unable to find ${BULK_DATA_TYPE} in the Scryfall bulk data manifest`);
    }
    return bulkDataFile;
  }

  private async downloadBulkDataFile(downloadUri: string, destinationPath: string): Promise<void> {
    const response = await fetch(downloadUri, {
      headers: { Accept: "application/json;q=0.9,*/*;q=0.8", "User-Agent": SCRYFALL_USER_AGENT },
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

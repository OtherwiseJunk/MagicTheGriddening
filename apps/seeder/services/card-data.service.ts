import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
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
}

const BULK_DATA_TYPE = "oracle_cards";
const SCRYFALL_API_URL = "https://api.scryfall.com/bulk-data";
const SCRYFALL_USER_AGENT =
  "magic-the-griddening/0.1 (+https://github.com/otherwisejunk/MagicTheGriddening)";

function getDataDirectory(): string {
  return process.env.BULK_DATA_DIR ?? path.join(process.cwd(), "data");
}

function buildLocalCards(rawCards: ScryfallBulkCard[]): LocalCard[] {
  return rawCards
    .filter((card) => card.games?.includes("paper") ?? false)
    .map((card) => {
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

      return {
        name: card.name,
        faceNames: faces.map((f) => f.name ?? "").filter(Boolean),
        type_line: card.type_line ?? "",
        colors,
        cmc: card.cmc ?? 0,
        rarity: card.rarity ?? "",
        oracle_text,
        power: card.power ?? faces[0]?.power,
        toughness: card.toughness ?? faces[0]?.toughness,
        artist: card.artist ?? faces[0]?.artist ?? "",
        set: card.set ?? "",
        set_name: card.set_name ?? "",
        set_type: card.set_type ?? "",
        released_at: card.released_at,
        imagePng,
      };
    });
}

export class CardDataService {
  private initPromise: Promise<LocalCard[]> | null = null;

  async getSets(): Promise<LocalSet[]> {
    const cards = await this.getCards();
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

  async getCards(): Promise<LocalCard[]> {
    if (!this.initPromise) {
      this.initPromise = this.loadOrDownload();
    }
    return this.initPromise;
  }

  private async loadOrDownload(): Promise<LocalCard[]> {
    const dataDir = getDataDirectory();
    const indexPath = path.join(dataDir, "card-index.json");

    await mkdir(dataDir, { recursive: true });

    try {
      const stored = JSON.parse(await readFile(indexPath, "utf8")) as CardIndexFile;
      console.log(`Loaded ${stored.cards.length} cards from disk (${indexPath})`);
      return stored.cards;
    } catch {
      console.log("card-index.json not found — downloading from Scryfall...");
    }

    return this.downloadAndSave(dataDir, indexPath);
  }

  private async downloadAndSave(dataDir: string, indexPath: string): Promise<LocalCard[]> {
    const bulkDataFile = await this.fetchBulkDataFile();
    const tempBulkPath = path.join(dataDir, `bulk-${randomUUID()}.json`);
    const tempIndexPath = path.join(dataDir, `index-${randomUUID()}.json`);

    try {
      await this.downloadBulkDataFile(bulkDataFile.download_uri, tempBulkPath);
      const rawCards = JSON.parse(await readFile(tempBulkPath, "utf8")) as ScryfallBulkCard[];
      const cards = buildLocalCards(rawCards);
      const indexFile: CardIndexFile = {
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: bulkDataFile.updated_at,
        cards,
      };
      await writeFile(tempIndexPath, JSON.stringify(indexFile), "utf8");
      await rename(tempIndexPath, indexPath);
      console.log(`Downloaded and saved ${cards.length} cards to ${indexPath}`);
      return cards;
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
    if (!response.ok) {
      throw new Error(`Unable to download Scryfall bulk data file (${response.status})`);
    }
    await writeFile(destinationPath, new Uint8Array(await response.arrayBuffer()));
  }
}

import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

interface ScryfallBulkDataManifest {
  data: ScryfallBulkDataFile[];
}

interface ScryfallBulkDataFile {
  type: string;
  updated_at: string;
  download_uri: string;
}

interface ScryfallBulkCardFace {
  name?: string;
}

interface ScryfallBulkCard {
  name: string;
  games?: string[];
  card_faces?: ScryfallBulkCardFace[];
}

interface AutocompleteIndexFile {
  bulkType: string;
  generatedAt: string;
  sourceUpdatedAt: string;
  names: string[];
}

const BULK_DATA_TYPE = "oracle_cards";
const DEFAULT_MAX_RESULTS = 50;
const DEFAULT_REFRESH_INTERVAL_HOURS = 24;
const SCRYFALL_API_URL = "https://api.scryfall.com/bulk-data";
const SCRYFALL_USER_AGENT =
  "magic-the-griddening/0.1 (+https://github.com/otherwisejunk/MagicTheGriddening)";
const DATA_DIRECTORY = process.env.AUTOCOMPLETE_DATA_DIR ?? path.join(process.cwd(), "data");
const RAW_BULK_FILE_PATH = path.join(DATA_DIRECTORY, "scryfall-oracle-cards.json");
const INDEX_FILE_PATH = path.join(DATA_DIRECTORY, "autocomplete-index.json");
const REFRESH_INTERVAL_MS =
  Number(process.env.AUTOCOMPLETE_REFRESH_INTERVAL_HOURS ?? DEFAULT_REFRESH_INTERVAL_HOURS) *
  60 *
  60 *
  1000;

function normalizeAutocompleteQuery(value: string): string {
  return value.trim().toLowerCase();
}

export function buildAutocompleteCardNames(cards: ScryfallBulkCard[]): string[] {
  const uniqueNames = new Set<string>();

  cards.forEach((card) => {
    if (!(card.games?.includes("paper") ?? false)) {
      return;
    }

    uniqueNames.add(card.name);
    card.card_faces?.forEach((cardFace) => {
      if (cardFace.name !== undefined && cardFace.name !== "") {
        uniqueNames.add(cardFace.name);
      }
    });
  });

  return Array.from(uniqueNames).sort((left, right) => left.localeCompare(right));
}

export function getAutocompleteMatches(
  cardNames: string[],
  query: string,
  limit: number = DEFAULT_MAX_RESULTS,
): string[] {
  const normalizedQuery = normalizeAutocompleteQuery(query);
  if (normalizedQuery.length < 3) {
    return [];
  }

  const exactMatches: string[] = [];
  const partialMatches: string[] = [];

  cardNames.forEach((cardName) => {
    const normalizedCardName = normalizeAutocompleteQuery(cardName);

    if (!normalizedCardName.includes(normalizedQuery)) {
      return;
    }

    if (normalizedCardName === normalizedQuery) {
      exactMatches.push(cardName);
      return;
    }

    partialMatches.push(cardName);
  });

  return exactMatches.concat(partialMatches).slice(0, limit);
}

export default class AutocompleteService {
  private static initPromise: Promise<void> | null = null;
  private static refreshPromise: Promise<void> | null = null;
  private static refreshTimer: NodeJS.Timeout | null = null;
  private static sourceUpdatedAt = "";
  private static cardNames: string[] = [];

  static prime(): void {
    if (this.cardNames.length > 0) {
      this.ensureRefreshTimer();
      return;
    }

    if (this.initPromise === null) {
      this.initPromise = this.initialize().finally(() => {
        this.initPromise = null;
      });
    }
  }

  static async getSuggestions(
    query: string,
    limit: number = DEFAULT_MAX_RESULTS,
  ): Promise<string[]> {
    if (normalizeAutocompleteQuery(query).length < 3) {
      return [];
    }

    this.prime();

    if (this.cardNames.length === 0 && this.initPromise !== null) {
      await this.initPromise;
    }

    if (this.cardNames.length === 0) {
      await this.refreshIndex();
    }

    return getAutocompleteMatches(this.cardNames, query, limit);
  }

  private static async initialize(): Promise<void> {
    await this.loadIndexFromDisk();
    this.ensureRefreshTimer();

    if (this.cardNames.length === 0) {
      await this.refreshIndex();
    }
  }

  private static async loadIndexFromDisk(): Promise<void> {
    await mkdir(DATA_DIRECTORY, { recursive: true });

    try {
      const storedIndex = JSON.parse(
        await readFile(INDEX_FILE_PATH, "utf8"),
      ) as AutocompleteIndexFile;
      this.setIndex(storedIndex);
    } catch {
      this.cardNames = [];
      this.sourceUpdatedAt = "";
    }
  }

  private static ensureRefreshTimer(): void {
    if (
      this.refreshTimer !== null ||
      process.env.NODE_ENV === "test" ||
      !Number.isFinite(REFRESH_INTERVAL_MS) ||
      REFRESH_INTERVAL_MS <= 0
    ) {
      return;
    }

    this.refreshTimer = setInterval(() => {
      void this.refreshIndex().catch((error: unknown) => {
        console.error("Error refreshing autocomplete index:", error);
      });
    }, REFRESH_INTERVAL_MS);

    this.refreshTimer.unref?.();
  }

  private static async refreshIndex(): Promise<void> {
    if (this.refreshPromise !== null) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.performRefresh().finally(() => {
      this.refreshPromise = null;
    });

    await this.refreshPromise;
  }

  private static async performRefresh(): Promise<void> {
    await mkdir(DATA_DIRECTORY, { recursive: true });

    const bulkDataFile = await this.fetchBulkDataFile();
    if (bulkDataFile.updated_at === this.sourceUpdatedAt && this.cardNames.length > 0) {
      return;
    }

    const tempBulkFilePath = path.join(DATA_DIRECTORY, `bulk-${randomUUID()}.json`);
    const tempIndexFilePath = path.join(DATA_DIRECTORY, `index-${randomUUID()}.json`);

    try {
      await this.downloadBulkDataFile(bulkDataFile.download_uri, tempBulkFilePath);

      const rawCards = JSON.parse(await readFile(tempBulkFilePath, "utf8")) as ScryfallBulkCard[];
      const nextIndex = {
        bulkType: BULK_DATA_TYPE,
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: bulkDataFile.updated_at,
        names: buildAutocompleteCardNames(rawCards),
      } satisfies AutocompleteIndexFile;

      await writeFile(tempIndexFilePath, JSON.stringify(nextIndex), "utf8");
      await rename(tempBulkFilePath, RAW_BULK_FILE_PATH);
      await rename(tempIndexFilePath, INDEX_FILE_PATH);
      this.setIndex(nextIndex);
    } finally {
      await rm(tempBulkFilePath, { force: true }).catch(() => undefined);
      await rm(tempIndexFilePath, { force: true }).catch(() => undefined);
    }
  }

  private static setIndex(index: AutocompleteIndexFile): void {
    this.sourceUpdatedAt = index.sourceUpdatedAt;
    this.cardNames = index.names;
  }

  private static async fetchBulkDataFile(): Promise<ScryfallBulkDataFile> {
    const response = await fetch(SCRYFALL_API_URL, {
      headers: {
        Accept: "application/json;q=0.9,*/*;q=0.8",
        "User-Agent": SCRYFALL_USER_AGENT,
      },
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

  private static async downloadBulkDataFile(
    downloadUri: string,
    destinationPath: string,
  ): Promise<void> {
    const response = await fetch(downloadUri, {
      headers: {
        Accept: "application/json;q=0.9,*/*;q=0.8",
        "User-Agent": SCRYFALL_USER_AGENT,
      },
      cache: "no-store",
    });

    if (!response.ok || response.body === null) {
      throw new Error(`Unable to download Scryfall bulk data file (${response.status})`);
    }

    await writeFile(destinationPath, Buffer.from(await response.arrayBuffer()));
  }
}

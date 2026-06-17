import { open } from "node:fs/promises";
import { SCRYFALL_API_URL, SCRYFALL_USER_AGENT } from "./constants";
import { type ScryfallBulkDataFile, type ScryfallBulkDataManifest } from "./types";

const HEADERS = {
  Accept: "application/json;q=0.9,*/*;q=0.8",
  "User-Agent": SCRYFALL_USER_AGENT,
};

export async function fetchBulkDataFile(bulkDataType: string): Promise<ScryfallBulkDataFile> {
  const response = await fetch(SCRYFALL_API_URL, {
    headers: HEADERS,
    cache: "no-store",
  } as RequestInit);
  if (!response.ok) {
    throw new Error(`Unable to fetch Scryfall bulk data manifest (${response.status})`);
  }
  const manifest = (await response.json()) as ScryfallBulkDataManifest;
  const file = manifest.data.find((entry) => entry.type === bulkDataType);
  if (!file) {
    throw new Error(`Unable to find ${bulkDataType} in the Scryfall bulk data manifest`);
  }
  return file;
}

export async function downloadBulkDataFile(
  downloadUri: string,
  destinationPath: string,
): Promise<void> {
  const response = await fetch(downloadUri, {
    headers: HEADERS,
    cache: "no-store",
  } as RequestInit);
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

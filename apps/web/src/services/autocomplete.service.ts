import { type LocalCard } from "@/models/local-card";
import BulkDataService from "@/services/bulk-data.service";

const DEFAULT_MAX_RESULTS = 50;

function normalizeAutocompleteQuery(value: string): string {
  return value.trim().toLowerCase();
}

export function buildAutocompleteNames(cards: LocalCard[]): string[] {
  const uniqueNames = new Set<string>();
  for (const card of cards) {
    if (card.faceNames.length > 0) {
      for (const faceName of card.faceNames) {
        uniqueNames.add(faceName);
      }
    } else {
      uniqueNames.add(card.name);
    }
  }
  return Array.from(uniqueNames).sort((a, b) => a.localeCompare(b));
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

  for (const cardName of cardNames) {
    const normalizedCardName = normalizeAutocompleteQuery(cardName);
    if (!normalizedCardName.includes(normalizedQuery)) continue;
    if (normalizedCardName === normalizedQuery) {
      exactMatches.push(cardName);
    } else {
      partialMatches.push(cardName);
    }
  }

  return exactMatches.concat(partialMatches).slice(0, limit);
}

export default class AutocompleteService {
  static async getSuggestions(
    query: string,
    limit: number = DEFAULT_MAX_RESULTS,
  ): Promise<string[]> {
    const cards = await BulkDataService.getCards();
    return getAutocompleteMatches(buildAutocompleteNames(cards), query, limit);
  }
}

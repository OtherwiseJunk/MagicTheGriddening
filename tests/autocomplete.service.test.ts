// tests/autocomplete.service.test.ts
import { describe, expect, it } from "vitest";
import { buildAutocompleteNames, getAutocompleteMatches } from "@/services/autocomplete.service";
import { type LocalCard } from "@/models/local-card";

function makeCard(overrides: Partial<LocalCard> = {}): LocalCard {
  return {
    name: "Forest",
    faceNames: [],
    type_line: "Basic Land — Forest",
    colors: [],
    cmc: 0,
    rarity: "common",
    oracle_text: "",
    power: undefined,
    toughness: undefined,
    artist: "John Avon",
    set: "m20",
    imagePng: "/forest.png",
    ...overrides,
  };
}

describe("AutocompleteService helpers", () => {
  it("builds a deduplicated, alphabetized list of card names and face names", () => {
    const names = buildAutocompleteNames([
      makeCard({ name: "Forest" }),
      makeCard({ name: "Forest" }),
      makeCard({
        name: "Delver of Secrets // Insectile Aberration",
        faceNames: ["Delver of Secrets", "Insectile Aberration"],
      }),
    ]);

    expect(names).toEqual(["Delver of Secrets", "Forest", "Insectile Aberration"]);
  });

  it("puts exact case-insensitive matches first and keeps other matches alphabetized", () => {
    const matches = getAutocompleteMatches(
      ["A-Forest", "Forest", "Forest Bear", "Forest Dryad"],
      "forest",
    );

    expect(matches).toEqual(["Forest", "A-Forest", "Forest Bear", "Forest Dryad"]);
  });

  it("returns no matches for short queries", () => {
    expect(getAutocompleteMatches(["Forest", "Island"], "fo")).toEqual([]);
  });
});

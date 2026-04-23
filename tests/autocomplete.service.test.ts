import { describe, expect, it } from "vitest";
import {
  buildAutocompleteCardNames,
  getAutocompleteMatches,
} from "@/services/autocomplete.service";

describe("AutocompleteService helpers", () => {
  it("builds a deduplicated, alphabetized list of paper card names and face names", () => {
    const cardNames = buildAutocompleteCardNames([
      { name: "Forest", games: ["paper"] },
      { name: "Forest", games: ["paper"] },
      {
        name: "Delver of Secrets",
        games: ["paper"],
        card_faces: [{ name: "Delver of Secrets" }, { name: "Insectile Aberration" }],
      },
      { name: "Alchemy Card", games: ["arena"] },
      { name: "MTGO Card", games: ["mtgo"] },
    ]);

    expect(cardNames).toEqual(["Delver of Secrets", "Forest", "Insectile Aberration"]);
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

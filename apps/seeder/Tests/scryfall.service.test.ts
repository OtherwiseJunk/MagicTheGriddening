import { ScryfallService } from "../services/scryfall.service.js";
import * as Scry from "scryfall-sdk";
import { expect, test, beforeEach, describe } from "vitest";

describe("ScryfallService", () => {
  let scryfallService: ScryfallService;

  beforeEach(() => {
    scryfallService = new ScryfallService(Scry);
  });

  test("should be created", () => {
    expect(scryfallService).toBeTruthy();
  });

  test("should get all sets", async () => {
    const sets = await scryfallService.getAllSets();
    expect(sets).toBeTruthy();
    expect(sets.length).toBeGreaterThan(0);
  });

  test("should get first page card count", { timeout: 10000 }, async () => {
    const query = "c:Blue";
    const cardCount = await scryfallService.getFirstPageCardCount(query);
    expect(cardCount).toBeTruthy();
    // 175 is the maximum card size and we're querying for all blue cards, so we know we should always hit the limit
    expect(cardCount).toBe(175);
  });
});

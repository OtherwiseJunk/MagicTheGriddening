import { describe, it, expect } from "vitest";
import { toDisplayCardImage } from "@/lib/cardImage";

describe("toDisplayCardImage", () => {
  it("rewrites a Scryfall png URL (with query) to the normal jpg variant", () => {
    expect(
      toDisplayCardImage(
        "https://cards.scryfall.io/png/front/f/b/fb97e2a1-0e86-4c12-8d31-6ff7b825ca10.png?1782724639",
      ),
    ).toBe(
      "https://cards.scryfall.io/normal/front/f/b/fb97e2a1-0e86-4c12-8d31-6ff7b825ca10.jpg?1782724639",
    );
  });

  it("rewrites a Scryfall png URL without a query string", () => {
    expect(
      toDisplayCardImage("https://cards.scryfall.io/png/front/e/9/e9d5aee0.png"),
    ).toBe("https://cards.scryfall.io/normal/front/e/9/e9d5aee0.jpg");
  });

  it("leaves the local card-not-found fallback untouched", () => {
    expect(toDisplayCardImage("/card-not-found.png")).toBe("/card-not-found.png");
  });

  it("leaves any non-Scryfall URL untouched", () => {
    expect(toDisplayCardImage("https://example.com/foo/bar.png")).toBe(
      "https://example.com/foo/bar.png",
    );
  });
});

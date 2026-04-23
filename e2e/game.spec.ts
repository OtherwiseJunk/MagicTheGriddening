import { test, expect, type Page } from "@playwright/test";

// These tests run against puzzle 1 (dateString 20260101):
// Top constraints: Red, Power 2, Common
// Side constraints: Goblin, Mana Value 2, Toughness 2

// The input dialog is the one with a text input; the rules dialog has no input.
// Scope autocomplete selectors to the dialog containing the input.
const inputDialog = (page: Page) => page.locator("dialog:has(input[type='text'])");
const autocompleteList = (page: Page) => inputDialog(page).locator("ul");
const autocompleteItem = (page: Page) => autocompleteList(page).locator("li");
const exactAutocompleteItem = (page: Page, cardName: string) =>
  autocompleteItem(page).filter({ hasText: cardName });
const duplicateTestCardName = "Battle Cry Goblin";

test.describe("Game board", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("griddening.userId");
    });
  });

  test("renders the game grid with constraint headers", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("Magic: The Griddening");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    // Constraint headers from puzzle 1
    await expect(page.locator("text=Red")).toBeVisible();
    await expect(page.locator("text=Power 2")).toBeVisible();
    await expect(page.locator("text=Common")).toBeVisible();
    await expect(page.locator("text=Goblin")).toBeVisible();
    await expect(page.locator("text=Mana Value 2")).toBeVisible();
    await expect(page.locator("text=Toughness 2")).toBeVisible();
  });

  test("shows the rules dialog", async ({ page }) => {
    await page.goto("/");

    await page.locator("button", { hasText: "Rules" }).click();

    await expect(page.locator("text=How to Play")).toBeVisible();
    await expect(page.locator("text=9 life points")).toBeVisible();
    await expect(page.locator("text=at least 10 valid cards")).toBeVisible();

    await page.locator("button", { hasText: "Got it" }).click();
    await expect(page.locator("text=How to Play")).not.toBeVisible();
  });

  test("shows the fan content disclaimer in the footer", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=unofficial Fan Content")).toBeVisible();
  });

  test("opens input dialog when clicking an empty square", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    await page.locator(".input-square.live-input").first().click();

    await expect(inputDialog(page).locator("input[type='text']")).toBeVisible();
    await expect(inputDialog(page).locator("input[placeholder='Search for a card...']")).toBeVisible();
  });

  test("autocomplete triggers after typing 3 characters", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    await page.locator(".input-square.live-input").first().click();
    const input = inputDialog(page).locator("input[type='text']");

    // Type 2 chars — no dropdown
    await input.fill("go");
    await page.waitForTimeout(500);
    await expect(autocompleteList(page)).not.toBeVisible();

    // Type 3 chars — dropdown should appear with card options
    await input.fill("gob");
    await expect(autocompleteItem(page).first()).toBeVisible({ timeout: 15000 });
  });

  test("submitting an incorrect guess deducts a life point", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    await page.locator(".input-square.live-input").first().click();
    const input = inputDialog(page).locator("input[type='text']");

    // Type a short wrong card name (< 3 chars avoids autocomplete)
    await input.fill("zz");
    await inputDialog(page).locator("button", { hasText: "Submit" }).click();

    await expect(input).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Life Points: 8")).toBeVisible({ timeout: 15000 });
  });

  test("submitting a correct guess reveals the card image", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    // Open dialog on the first square (Red + Goblin intersection)
    await page.locator(".input-square.live-input").first().click();
    const input = inputDialog(page).locator("input[type='text']");

    // Search for a known-valid card that matches Red + Goblin
    await input.fill(duplicateTestCardName);
    await expect(exactAutocompleteItem(page, duplicateTestCardName)).toBeVisible({
      timeout: 15000,
    });
    await exactAutocompleteItem(page, duplicateTestCardName).click();

    // Submit the selected card
    await inputDialog(page).locator("button", { hasText: "Submit" }).click();

    // Wait for dialog to close
    await expect(input).not.toBeVisible({ timeout: 15000 });

    // A card image should now be visible in the grid
    await expect(page.locator(".input-square img").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Game over state", () => {
  test("shows copy results button when life reaches 0", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("griddening.userId");
    });

    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    for (let i = 0; i < 9; i++) {
      const squares = page.locator(".input-square.live-input");
      const count = await squares.count();
      if (count === 0) break;

      await squares.first().click();
      const input = inputDialog(page).locator("input[type='text']");
      await expect(input).toBeVisible({ timeout: 10000 });

      // Type a short wrong card name (< 3 chars avoids autocomplete)
      await input.fill("zz");
      await inputDialog(page).locator("button", { hasText: "Submit" }).click();

      await expect(input).not.toBeVisible({ timeout: 15000 });

      const expectedLife = 9 - (i + 1);
      if (expectedLife > 0) {
        await expect(page.locator(`text=Life Points: ${expectedLife}`)).toBeVisible({ timeout: 15000 });
      }
    }

    await expect(page.locator("text=Life Points: 0")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("button", { hasText: "Copy Results" })).toBeVisible({ timeout: 15000 });
  });
});

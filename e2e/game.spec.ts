import { test, expect } from "@playwright/test";

// These tests run against puzzle 1 (dateString 20260101):
// Top constraints: Red, Power 2, Common
// Side constraints: Goblin, Mana Value 2, Toughness 2
//
// A card that fits [Red + Goblin] intersection: "Goblin Piker" (red goblin, power 2, common, cmc 2, tou 1)
// We'll use the autocomplete to find real cards that match.

test.describe("Game board", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing userId so each test starts fresh
    await page.addInitScript(() => {
      localStorage.removeItem("griddening.userId");
    });
  });

  test("renders the game grid with constraint headers", async ({ page }) => {
    await page.goto("/");

    // Header should be visible
    await expect(page.locator("h1")).toContainText("Magic: The Griddening");

    // Life points should start at 9
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    // Constraint headers from puzzle 1 should be visible
    await expect(page.locator("text=Red")).toBeVisible();
    await expect(page.locator("text=Power 2")).toBeVisible();
    await expect(page.locator("text=Common")).toBeVisible();
    await expect(page.locator("text=Goblin")).toBeVisible();
    await expect(page.locator("text=Mana Value 2")).toBeVisible();
    await expect(page.locator("text=Toughness 2")).toBeVisible();
  });

  test("shows the rules dialog", async ({ page }) => {
    await page.goto("/");

    // Click the Rules button
    await page.locator("button", { hasText: "Rules" }).click();

    // Rules dialog should be visible
    await expect(page.locator("text=How to Play")).toBeVisible();
    await expect(page.locator("text=9 life points")).toBeVisible();
    await expect(page.locator("text=at least 10 valid cards")).toBeVisible();

    // Close it
    await page.locator("button", { hasText: "Got it" }).click();
    await expect(page.locator("text=How to Play")).not.toBeVisible();
  });

  test("shows the fan content disclaimer in the footer", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=unofficial Fan Content")).toBeVisible();
  });

  test("opens input dialog when clicking an empty square", async ({ page }) => {
    await page.goto("/");

    // Wait for the game to load
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    // Click the first input square (an empty clickable square)
    await page.locator(".input-square.live-input").first().click();

    // The dialog should open with a search input
    await expect(page.locator("dialog input[type='text']")).toBeVisible();
    await expect(page.locator("text=Search for a card...")).toBeVisible();
  });

  test("autocomplete triggers after typing 3 characters", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    // Open dialog
    await page.locator(".input-square.live-input").first().click();
    const input = page.locator("dialog input[type='text']");

    // Type 2 chars — no dropdown
    await input.fill("go");
    await page.waitForTimeout(500);
    await expect(page.locator("dialog ul")).not.toBeVisible();

    // Type 3 chars — dropdown should appear
    await input.fill("gob");
    await expect(page.locator("dialog ul")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("dialog li").first()).toBeVisible();
  });

  test("submitting an incorrect guess deducts a life point", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    // Open dialog on the first square
    await page.locator(".input-square.live-input").first().click();
    const input = page.locator("dialog input[type='text']");

    // Type a card name that won't match the constraints
    // "Island" is a land, not a Red Goblin
    await input.fill("Island");
    await page.locator("dialog button", { hasText: "Submit" }).click();

    // Wait for dialog to close and life to update
    await expect(page.locator("dialog input[type='text']")).not.toBeVisible({ timeout: 10000 });

    // Life points should be fetched from server — should be 8
    await expect(page.locator("text=Life Points: 8")).toBeVisible({ timeout: 10000 });
  });

  test("submitting a correct guess reveals the card image", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    // Open dialog on the first square (Red + Goblin intersection)
    await page.locator(".input-square.live-input").first().click();
    const input = page.locator("dialog input[type='text']");

    // Search for a card that matches Red + Goblin
    await input.fill("Goblin");
    await expect(page.locator("dialog ul")).toBeVisible({ timeout: 10000 });

    // Click the first autocomplete result
    await page.locator("dialog li").first().click();

    // Submit the selected card
    await page.locator("dialog button", { hasText: "Submit" }).click();

    // Wait for dialog to close
    await expect(page.locator("dialog input[type='text']")).not.toBeVisible({ timeout: 10000 });

    // A card image should now be visible in the grid
    await expect(page.locator(".input-square img.card-revealed").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Game over state", () => {
  test("shows copy results button when life reaches 0", async ({ page }) => {
    // This test would require exhausting all 9 life points
    // We'll check that the Copy Results button appears when lifePoints <= 0
    // by making 9 incorrect guesses

    await page.addInitScript(() => {
      localStorage.removeItem("griddening.userId");
    });

    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    for (let i = 0; i < 9; i++) {
      // Open any available square
      const squares = page.locator(".input-square.live-input");
      const count = await squares.count();
      if (count === 0) break;

      await squares.first().click();
      const input = page.locator("dialog input[type='text']");
      await expect(input).toBeVisible({ timeout: 5000 });

      // Submit a card that won't match any constraints
      await input.fill("Island");
      await page.locator("dialog button", { hasText: "Submit" }).click();

      // Wait for dialog to close
      await expect(input).not.toBeVisible({ timeout: 10000 });

      // Wait for life points to update
      const expectedLife = 9 - (i + 1);
      if (expectedLife > 0) {
        await expect(page.locator(`text=Life Points: ${expectedLife}`)).toBeVisible({ timeout: 10000 });
      }
    }

    // Game should be over — Copy Results button should appear
    await expect(page.locator("text=Life Points: 0")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("button", { hasText: "Copy Results" })).toBeVisible({ timeout: 10000 });
  });
});

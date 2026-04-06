import { test, expect } from "@playwright/test";

// Tests the duplicate card rejection feature against puzzle 1 (dateString 20260101):
// Top constraints: Red, Power 2, Common
// Side constraints: Goblin, Mana Value 2, Toughness 2

test.describe("Duplicate card rejection", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("griddening.userId");
    });
  });

  test("shows error when submitting the same card to two different squares", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Life Points: 9")).toBeVisible();

    // Open the first square and submit a card via autocomplete
    const squares = page.locator(".input-square.live-input");
    await squares.first().click();

    let input = page.locator("dialog input[type='text']");
    await input.fill("Goblin");
    await expect(page.locator("dialog ul")).toBeVisible({ timeout: 10000 });

    // Pick the first result and submit
    const firstCardName = await page.locator("dialog li").first().textContent();
    await page.locator("dialog li").first().click();
    await page.locator("dialog button", { hasText: "Submit" }).click();

    // Wait for dialog to close
    await expect(input).not.toBeVisible({ timeout: 10000 });

    // Now open a different square and try to submit the same card
    const liveSquares = page.locator(".input-square.live-input");
    await liveSquares.first().click();

    input = page.locator("dialog input[type='text']");
    await input.fill(firstCardName ?? "Goblin");
    await expect(page.locator("dialog ul")).toBeVisible({ timeout: 10000 });
    await page.locator("dialog li").first().click();
    await page.locator("dialog button", { hasText: "Submit" }).click();

    // The dialog should stay open with an error message
    await expect(page.locator("text=already used that card")).toBeVisible({ timeout: 10000 });

    // The dialog input should still be visible (not closed)
    await expect(page.locator("dialog input[type='text']")).toBeVisible();
  });
});

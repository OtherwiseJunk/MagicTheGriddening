import { test, expect, type Page } from "@playwright/test";

// Tests the duplicate card rejection feature against puzzle 1 (dateString 20260101)

const inputDialog = (page: Page) => page.locator("dialog:has(input[type='text'])");
const autocompleteItem = (page: Page) => inputDialog(page).locator("ul li");
const exactAutocompleteItem = (page: Page, cardName: string) =>
  autocompleteItem(page).filter({ hasText: cardName });
const duplicateTestCardName = "Battle Cry Goblin";

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
    await page.locator(".input-square.live-input").first().click();

    let input = inputDialog(page).locator("input[type='text']");
    await input.fill(duplicateTestCardName);
    await expect(exactAutocompleteItem(page, duplicateTestCardName)).toBeVisible({
      timeout: 15000,
    });
    await exactAutocompleteItem(page, duplicateTestCardName).click();

    // Submit
    await inputDialog(page).locator("button", { hasText: "Submit" }).click();
    await expect(input).not.toBeVisible({ timeout: 15000 });

    // Now open a different square and try to submit the same card
    await page.locator(".input-square.live-input").first().click();
    input = inputDialog(page).locator("input[type='text']");

    await input.fill(duplicateTestCardName);
    await expect(exactAutocompleteItem(page, duplicateTestCardName)).toBeVisible({
      timeout: 15000,
    });
    await exactAutocompleteItem(page, duplicateTestCardName).click();

    await inputDialog(page).locator("button", { hasText: "Submit" }).click();

    // The dialog should stay open with an error message
    await expect(inputDialog(page).locator("text=already used that card")).toBeVisible({ timeout: 15000 });
    await expect(input).toBeVisible();
  });
});

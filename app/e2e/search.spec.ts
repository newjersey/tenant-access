import { expect, test } from "@playwright/test";
import content from "../src/data/content/en/search-results.json" with { type: "json" };
import { expectNoAxeViolations, stubSearchApi } from "./support";

const LISTING_LINK = { name: "1 Main St" };

test.beforeEach(async ({ page }) => {
  await stubSearchApi(page);
});

test.describe("search results page", () => {
  test("renders listings returned by the API", async ({ page }) => {
    await page.goto("/search?location=Trenton");

    await expect(page.getByRole("heading", { level: 1, name: content.heading })).toBeVisible();
    await expect(page.getByRole("link", LISTING_LINK)).toBeVisible();
    await expect(page.getByLabel(content.sort_label)).toHaveValue("updated");
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/search?location=Trenton");
    // Scan the loaded page, not the spinner.
    await expect(page.getByRole("link", LISTING_LINK)).toBeVisible();

    await expectNoAxeViolations(page);
  });
});

import { expect, test } from "@playwright/test";
import content from "../src/data/content/en/search-results.json" with { type: "json" };
import { expectNoAxeViolations } from "./support";

test.describe("search results page", () => {
  test("renders without accessibility violations", async ({ page }) => {
    await page.goto("/search?location=Trenton");
    await expect(page.getByRole("heading", { level: 1, name: content.heading })).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

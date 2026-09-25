import { expect, test } from "@playwright/test";
import content from "../src/data/content/en/notfound.json" with { type: "json" };
import { expectNoAxeViolations } from "./support";

test.describe("not found page", () => {
  test("renders without accessibility violations", async ({ page }) => {
    await page.goto("/nonsense");
    await expect(page.getByRole("heading", { level: 1, name: content.heading })).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

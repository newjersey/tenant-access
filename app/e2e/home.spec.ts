import { expect, test } from "@playwright/test";
import content from "../src/data/content/en/home.json" with { type: "json" };
import { expectNoAxeViolations } from "./support";

test.describe("home page", () => {
  test("renders without accessibility violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: content.heading })).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

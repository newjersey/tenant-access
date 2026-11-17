import { expect, type Page } from "@playwright/test";
import content from "../src/data/content/en/listing-detail.json" with { type: "json" };
import { makeLegacyDetails } from "../src/test/makeLegacyDetails";
import { makeListing } from "../src/test/makeListing";
import { expectNoAxeViolations, test } from "./support";

const LISTING_URL = "https://api.e2e.test/listings/7";

const listing = makeListing({
  uid: 7,
  name: "Valor Pointe",
  rentType: "Income Based Rent",
  depositRange: "$750 - $3,300",
  amenities: ["Washer/Dryer", "No Smoking"],
  legacyDetails: makeLegacyDetails(),
});

async function mockListing(page: Page, status: number, body: unknown) {
  await page.route(LISTING_URL, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    }),
  );
}

test.describe("listing detail page", () => {
  test("renders without accessibility violations, accordions open or closed", async ({ page }) => {
    await mockListing(page, 200, { success: true, listing });
    await page.goto("/listings/7");

    await expect(page.getByRole("heading", { level: 1, name: "Valor Pointe" })).toBeVisible();
    await expectNoAxeViolations(page);

    for (const toggle of await page.locator(".usa-accordion__button").all()) {
      await toggle.click();
    }
    await expectNoAxeViolations(page);
  });

  test("explains a missing listing without accessibility violations", async ({ page }) => {
    await mockListing(page, 404, { success: false, error: "Listing not found" });
    await page.goto("/listings/7");

    await expect(
      page.getByRole("heading", { level: 1, name: content.not_found_heading }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

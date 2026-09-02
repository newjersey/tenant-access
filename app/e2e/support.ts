import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import type { Listing, SearchListingsResponse } from "../src/clients/listings";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

export async function expectNoAxeViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const summary = violations.map((violation) => {
    const targets = violation.nodes.map((node) => node.target.join(" ")).join(" | ");
    return `${violation.id}: ${targets}`;
  });

  expect(summary).toEqual([]);
}

const FIXTURE_LISTING: Listing = {
  uid: 1,
  name: "Sunset Apartments",
  address: "1 Main St",
  city: "Trenton",
  state: "NJ",
  zipCode: "08608",
  rent: 1500,
  rentMax: null,
  bedrooms: 2,
  bathrooms: 1,
  unitType: "Apartment",
  imageId: null,
  imageUrl: null,
  phoneNumber: "609-555-0100",
  website: null,
  description: "Two bedrooms near the train station.",
  lastUpdated: "2026-08-01",
  isWaitlistOpen: false,
  amenities: ["Parking"],
  contactName: null,
  contactOrganization: null,
  fullListingUrl: "https://example.test/1",
  rentType: "Market",
  depositRange: null,
};

export async function stubSearchApi(page: Page, listings = [FIXTURE_LISTING]): Promise<void> {
  const body: SearchListingsResponse = {
    success: true,
    listings,
    pagination: { page: 1, pageSize: 20, total: listings.length },
  };

  await page.route("**/listings/search*", (route) =>
    route.fulfill({
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    }),
  );
}

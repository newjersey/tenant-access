import { describe, expect, it } from "vitest";
import { formatAddress, formatListingName, formatRent, formatUnitSummary } from "./formatListing";

describe("formatRent", () => {
  it("shows a single figure when there is no maximum", () => {
    expect(formatRent({ rent: 1200, rentMax: null })).toBe("$1,200/month");
  });

  it("shows a range when the maximum is higher", () => {
    expect(formatRent({ rent: 1200, rentMax: 1500 })).toBe("$1,200-$1,500/month");
  });

  it("collapses a maximum that matches or undercuts the rent", () => {
    expect(formatRent({ rent: 1200, rentMax: 1200 })).toBe("$1,200/month");
    expect(formatRent({ rent: 1200, rentMax: 900 })).toBe("$1,200/month");
  });

  it("falls back to the maximum alone", () => {
    expect(formatRent({ rent: null, rentMax: 1500 })).toBe("Up to $1,500/month");
  });

  it("returns null when no rent was captured", () => {
    expect(formatRent({ rent: null, rentMax: null })).toBeNull();
  });
});

describe("formatUnitSummary", () => {
  it("joins bedrooms and bathrooms", () => {
    expect(formatUnitSummary({ bedrooms: 2, bathrooms: 1, unitType: "Apartment" })).toBe(
      "2 bed | 1 bath",
    );
  });

  it("drops a trailing .0 but keeps a half", () => {
    expect(
      formatUnitSummary({
        bedrooms: 2,
        bathrooms: "1.0" as unknown as number,
        unitType: "Apartment",
      }),
    ).toBe("2 bed | 1 bath");
    expect(
      formatUnitSummary({
        bedrooms: 1,
        bathrooms: "1.5" as unknown as number,
        unitType: "Apartment",
      }),
    ).toBe("1 bed | 1.5 bath");
  });

  it("calls zero bedrooms in apartment a studio", () => {
    expect(formatUnitSummary({ bedrooms: 0, bathrooms: 1, unitType: "Apartment" })).toBe(
      "Studio | 1 bath",
    );
    expect(formatUnitSummary({ bedrooms: 0, bathrooms: null, unitType: "Apartment" })).toBe(
      "Studio",
    );
  });

  it("calls zero bedrooms in shared housing by unit type", () => {
    expect(
      formatUnitSummary({ bedrooms: 0, bathrooms: 6, unitType: "Shared Housing/Room to Rent" }),
    ).toBe("Shared Housing/Room to Rent | 6 bath");
    expect(
      formatUnitSummary({ bedrooms: 0, bathrooms: null, unitType: "Shared Housing/Room to Rent" }),
    ).toBe("Shared Housing/Room to Rent");
  });

  it("skips a missing figure", () => {
    expect(formatUnitSummary({ bedrooms: null, bathrooms: 1, unitType: "Apartment" })).toBe(
      "1 bath",
    );
  });

  it("returns null when neither is known", () => {
    expect(
      formatUnitSummary({ bedrooms: null, bathrooms: null, unitType: "Apartment" }),
    ).toBeNull();
  });
});

describe("formatAddress", () => {
  it("builds a single line", () => {
    expect(
      formatAddress({ address: "221 King Street", city: "Clifton", state: "NJ", zipCode: "08608" }),
    ).toBe("221 King Street, Clifton, NJ 08608");
  });
});

describe("formatListingName", () => {
  it("falls back to the street address when the name is blank", () => {
    expect(formatListingName({ name: "", address: "813 ARCHER STREET" })).toBe("813 Archer Street");
  });

  it("falls back to the street address when the name is a placeholder", () => {
    expect(formatListingName({ name: "none", address: "67 edgar" })).toBe("67 Edgar");
    expect(formatListingName({ name: ".", address: "716 s 20th st" })).toBe("716 S 20th St");
    expect(formatListingName({ name: "852", address: "599 15th Avenue" })).toBe("599 15th Avenue");
  });

  it("title-cases all-caps text, keeping small words and acronyms", () => {
    expect(formatListingName({ name: "WOODLAND AT HOPEWELL PARK", address: "1 Main St" })).toBe(
      "Woodland at Hopewell Park",
    );
    expect(formatListingName({ name: "HOBOKEN YMCA", address: "1 Main St" })).toBe("Hoboken YMCA");
    expect(
      formatListingName({ name: "Cornerstone at Galloway - Phase II LLC", address: "1 Main St" }),
    ).toBe("Cornerstone at Galloway - Phase II LLC");
  });
});

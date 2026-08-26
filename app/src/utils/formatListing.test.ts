import { describe, expect, it } from "vitest";
import { formatAddress, formatRent, formatUnitSummary } from "./formatListing";

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
    expect(formatUnitSummary({ bedrooms: 2, bathrooms: 1 })).toBe("2 bd | 1 ba");
  });

  it("skips a missing figure, including a studio's zero bedrooms", () => {
    expect(formatUnitSummary({ bedrooms: null, bathrooms: 1 })).toBe("1 ba");
    expect(formatUnitSummary({ bedrooms: 0, bathrooms: null })).toBe("0 bd");
  });

  it("returns null when neither is known", () => {
    expect(formatUnitSummary({ bedrooms: null, bathrooms: null })).toBeNull();
  });
});

describe("formatAddress", () => {
  it("builds a single line", () => {
    expect(
      formatAddress({ address: "221 King Street", city: "Clifton", state: "NJ", zipCode: "08608" }),
    ).toBe("221 King Street, Clifton, NJ 08608");
  });
});

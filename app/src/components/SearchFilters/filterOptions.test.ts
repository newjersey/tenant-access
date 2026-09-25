import { describe, expect, it } from "vitest";
import {
  appliedFilters,
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  selectedValue,
} from "@/components/SearchFilters/filterOptions";
import content from "@/data/content/en/search-results.json";

describe("appliedFilters", () => {
  it("labels every filter set in the URL", () => {
    expect(
      appliedFilters(new URLSearchParams("bedrooms=studio&bathrooms=2&senior=true&maxRent=1200")),
    ).toEqual([
      { key: "bedrooms", label: `${content.filter_bedrooms_short}: ${content.filter_studio}` },
      { key: "bathrooms", label: `${content.filter_bathrooms_short}: 2+` },
      { key: "senior", label: content.filter_senior },
      { key: "maxRent", label: `${content.filter_max_rent_short}: $1,200` },
    ]);
  });

  it("skips filters that are missing or explicitly any", () => {
    expect(appliedFilters(new URLSearchParams("location=Newark&bedrooms=any"))).toEqual([]);
  });

  it("skips values that are not one of the offered options", () => {
    expect(appliedFilters(new URLSearchParams("bedrooms=nonsense"))).toEqual([]);
  });
});

describe("selectedValue", () => {
  it("keeps a value the options offer", () => {
    expect(selectedValue(BEDROOM_OPTIONS, "studio")).toBe("studio");
  });

  it("falls back to any when the value is missing or outside bounds", () => {
    expect(selectedValue(BEDROOM_OPTIONS, null)).toBe("any");
    expect(selectedValue(BATHROOM_OPTIONS, "7")).toBe("any");
  });
});

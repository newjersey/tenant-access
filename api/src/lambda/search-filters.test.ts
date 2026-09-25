import { describe, expect, it } from "vitest";
import { buildFilterClause } from "./search-filters.js";

// $1 and $2 are city and county, matching search-listings.
const FIRST_PLACEHOLDER = 3;
const build = (params: Record<string, string>) => buildFilterClause(params, FIRST_PLACEHOLDER);

describe("buildFilterClause", () => {
  it("filters nothing when no filter params are given", () => {
    expect(build({})).toEqual({ sql: "", values: [] });
  });

  it("treats any as no filter", () => {
    expect(build({ bedrooms: "any", bathrooms: "any" })).toEqual({ sql: "", values: [] });
  });

  it("reads a bedroom count as an exact match", () => {
    expect(build({ bedrooms: "2" })).toEqual({
      sql: "\n    AND bedrooms = $3",
      values: [2],
    });
  });

  it("reads a plus-suffixed bedroom count as a minimum", () => {
    expect(build({ bedrooms: "5+" })).toEqual({
      sql: "\n    AND bedrooms >= $3",
      values: [5],
    });
  });

  it("reads a bathroom count as a minimum", () => {
    expect(build({ bathrooms: "3" })).toEqual({
      sql: "\n    AND bathrooms >= $3",
      values: [3],
    });
  });

  it("ignores values outside the supported range or shape", () => {
    for (const value of ["0", "11", "-1", "abc", "  ", "5abc", "+5", "5++", "false", "TRUE"]) {
      expect(build({ bedrooms: value, bathrooms: value, senior: value })).toEqual({
        sql: "",
        values: [],
      });
    }
  });

  it("caps rent at the low end of a listing's range", () => {
    expect(build({ maxRent: "1200" })).toEqual({
      sql: "\n    AND rent <= $3",
      values: [1200],
    });
  });

  it("ignores a max rent that is not a plain figure of up to six digits", () => {
    for (const value of ["0", "01200", "-5", "1200.50", "1,200", "$1200", "abc", "1234567"]) {
      expect(build({ maxRent: value })).toEqual({ sql: "", values: [] });
    }
  });

  it("matches multiple filters, numbering placeholders in parameter order", () => {
    expect(build({ bedrooms: "studio", bathrooms: "1", senior: "true", maxRent: "1500" })).toEqual({
      sql:
        "\n    AND bedrooms = $3" +
        "\n    AND bathrooms >= $4" +
        "\n    AND amenities @> ARRAY[$5]::text[]" +
        "\n    AND rent <= $6",
      values: [0, 1, "Seniors Housing", 1500],
    });
  });
});

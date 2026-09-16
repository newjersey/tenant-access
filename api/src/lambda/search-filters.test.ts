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
    for (const value of ["0", "11", "-1", "abc", "  ", "5abc", "+5", "5++"]) {
      expect(build({ bedrooms: value, bathrooms: value })).toEqual({ sql: "", values: [] });
    }
  });
});

import { describe, expect, it } from "vitest";
import { SEARCH_URL } from "./source.js";

describe("SEARCH_URL", () => {
  it("carries all the search parameters", () => {
    const { searchParams } = new URL(SEARCH_URL);

    expect(Object.fromEntries(searchParams)).toEqual({
      direction: "desc",
      ch: "NJ",
      region_id: "33878",
      low_rent: "0",
      showmax: "-1",
      advanced: "t",
      nosp: "f",
      filter: "t",
      sortby: "last_updated",
      type: "rental",
      map_mode: "f",
    });
  });
});

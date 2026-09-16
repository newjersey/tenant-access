import { describe, expect, it } from "vitest";
import { SEARCH_QUERY_PARAMS } from "./search-params.js";

describe("search-params", () => {
  it("exists", () => {
    expect(SEARCH_QUERY_PARAMS.length).toBeGreaterThan(0);
  });
});

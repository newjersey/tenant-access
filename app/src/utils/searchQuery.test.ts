import { describe, expect, it } from "vitest";
import { parseSearchQuery } from "./searchQuery";

const parse = (query: string) => parseSearchQuery(new URLSearchParams(query));

describe("parseSearchQuery", () => {
  it("defaults to no location on the first page", () => {
    expect(parse("")).toEqual({ location: null, page: 1, sort: "updated" });
  });

  it("reads the location and page", () => {
    expect(parse("location=Newark&page=3")).toEqual({
      location: "Newark",
      page: 3,
      sort: "updated",
    });
  });

  it("trims the location and treats a blank one as no filter", () => {
    expect(parse("location=%20%20Jersey%20City%20%20").location).toBe("Jersey City");
    expect(parse("location=%20%20").location).toBeNull();
  });

  it("falls back to the first page when the page is not a number", () => {
    expect(parse("page=abc").page).toBe(1);
    expect(parse("page=").page).toBe(1);
  });

  it("clamps pages below one", () => {
    expect(parse("page=0").page).toBe(1);
    expect(parse("page=-4").page).toBe(1);
  });

  it("truncates a fractional page rather than rejecting it", () => {
    expect(parse("page=3.7").page).toBe(3);
  });

  it("reads a known sort and ignores an unknown one", () => {
    expect(parse("sort=price_asc").sort).toBe("price_asc");
    expect(parse("sort=price_desc").sort).toBe("price_desc");
    expect(parse("sort=blah").sort).toBe("updated");
  });
});

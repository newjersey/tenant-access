import { describe, expect, it } from "vitest";
import { resolveSlug, slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Fox Hollow")).toBe("fox-hollow");
  });

  it("collapses repeated whitespace into a single hyphen", () => {
    expect(slugify("Cedar   Ridge")).toBe("cedar-ridge");
  });

  it("trims surrounding whitespace", () => {
    expect(slugify("  Brookfield  ")).toBe("brookfield");
  });

  it("strips punctuation", () => {
    expect(slugify("St. Mary's")).toBe("st-marys");
  });
});

describe("resolveSlug", () => {
  it("generates a slug from the name when none is provided", () => {
    expect(resolveSlug({ name: "Silverton Falls" })).toBe("silverton-falls");
  });

  it("uses the explicit slug when present", () => {
    expect(resolveSlug({ name: "Silverton Falls", slug: "custom-slug" })).toBe("custom-slug");
  });

  it("falls back to generating when slug is an empty string", () => {
    expect(resolveSlug({ name: "Silverton Falls", slug: "" })).toBe("silverton-falls");
  });
});

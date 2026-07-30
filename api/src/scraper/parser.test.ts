import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseListings } from "./parser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("myhousingsearch parser", () => {
  it("should parse sample listings correctly", () => {
    const htmlFixturePath = join(__dirname, "../../fixtures/sample-listings-2026july24.html");
    const html = readFileSync(htmlFixturePath, "utf-8");
    const actual = parseListings(html);

    const jsonFixturePath = join(__dirname, "../../fixtures/sample-listings-expected.json");
    const json = readFileSync(jsonFixturePath, "utf-8");
    const expected = JSON.parse(json);

    // Strip lastUpdated from actual results for comparison
    const actualWithoutDates = actual.map(({ lastUpdated, ...rest }) => rest);

    expect(actualWithoutDates).toEqual(expected);

    // Separately verify lastUpdated fields are valid Dates
    for (const listing of actual) {
      if (listing.lastUpdated !== null) {
        expect(listing.lastUpdated).toBeInstanceOf(Date);
      }
    }
  });
});

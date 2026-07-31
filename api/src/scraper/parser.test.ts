import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type Listing, parseListings } from "./parser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("myhousingsearch parser", () => {
  it("should parse sample listings correctly", () => {
    const scrapeDate = new Date("2026-07-24T12:00:00.000Z");

    const htmlFixturePath = join(__dirname, "../../fixtures/sample-listings-2026july24.html");
    const html = readFileSync(htmlFixturePath, "utf-8");
    const actual = parseListings(html, scrapeDate);

    const jsonFixturePath = join(__dirname, "../../fixtures/sample-listings-expected.json");
    const json = readFileSync(jsonFixturePath, "utf-8");
    const expected = JSON.parse(json) as Listing[];

    expect(actual).toEqual(expected);
  });
});

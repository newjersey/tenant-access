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

  it("should return empty array when row_info is missing", () => {
    const html = "<html><body>No row_info here</body></html>";
    const scrapeDate = new Date("2026-07-24T12:00:00.000Z");
    const actual = parseListings(html, scrapeDate);

    expect(actual).toEqual([]);
  });

  it("should skip listings when element is missing", () => {
    const html = `
      <html>
        <script>
          var row_info = [
            {uid: 999999, image_id: null}
          ];
        </script>
        <body>
          <!-- No element with id="unit_999999" -->
        </body>
      </html>
    `;
    const scrapeDate = new Date("2026-07-24T12:00:00.000Z");
    const actual = parseListings(html, scrapeDate);

    expect(actual).toEqual([]);
  });

  it("should handle missing optional fields", () => {
    const html = `
      <script>var row_info = [{uid: 1, image_id: null}];</script>
      <li id="unit_1"></li>
    `;
    const scrapeDate = new Date("2026-07-24T12:00:00.000Z");
    const actual = parseListings(html, scrapeDate);
    expect(actual).toBeTruthy();
  });
});

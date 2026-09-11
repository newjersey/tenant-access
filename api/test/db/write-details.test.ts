import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { writeListingDetails } from "../../src/lambda/write-details.js";
import { parseListingDetail } from "../../src/scraper/detail-parser.js";
import { makeListing, seedListing, testClient, truncateAll } from "./support.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures");

function details(uid: number) {
  const html = readFileSync(join(FIXTURES, `legacy-listing-${uid}.html`), "utf-8");
  return parseListingDetail(html, uid);
}

const PHOTO_KEYS = [
  "photos/1229408/2828661.jpg",
  "photos/1229408/2828664.jpg",
  "photos/1229408/2828665.jpg",
];

let db: Client;

beforeAll(async () => {
  db = await testClient();
});

afterAll(async () => {
  await db.end();
});

beforeEach(async () => {
  await truncateAll(db);
  await seedListing(db, makeListing(1229408));
  await seedListing(db, makeListing(401275));
});

async function read(uid: number) {
  const { rows } = await db.query(
    `SELECT legacy_details AS details, photo_keys AS keys, details_scraped_at AS scraped
        FROM listings WHERE uid = $1`,
    [uid],
  );
  return rows[0];
}

describe("writeListingDetails against a real database", () => {
  it("fills in the detail columns of an existing listing", async () => {
    await writeListingDetails(db, details(1229408), PHOTO_KEYS);
    const row = await read(1229408);

    expect(row.keys).toEqual(PHOTO_KEYS);
    expect(row.scraped).not.toBeNull();
    expect(row.details).toMatchObject({
      availability: "Waiting List",
      yearBuilt: 2022,
      utilitiesIncluded: [],
    });
    expect(row.details.sections.Safety["Fire Safety"]).toEqual([
      "Smoke Detector With Strobe",
      "Carbon Monoxide Detector With Strobe",
      "Fire Supression / Sprinkler System",
      "Strobe Fire Alarm in Unit",
    ]);
  });

  it("records an empty photo list for a listing with no photos", async () => {
    await writeListingDetails(db, details(401275), []);

    expect(await read(401275)).toMatchObject({
      keys: [],
      details: { availability: "Under Construction", leaseLength: "Monthly", email: null },
    });
  });

  it("replaces a previous scrape rather than merging into it", async () => {
    await writeListingDetails(db, details(1229408), PHOTO_KEYS);
    await writeListingDetails(db, { ...details(1229408), availability: "Available" }, []);
    const row = await read(1229408);

    expect(row.details.availability).toBe("Available");
    expect(row.keys).toEqual([]);
  });

  it("finds listings by any row inside any section", async () => {
    await writeListingDetails(db, details(401275), []);
    await writeListingDetails(db, details(1229408), PHOTO_KEYS);

    // Containment is what the GIN index serves; ->> would work but scan.
    const { rows } = await db.query(
      `SELECT uid FROM listings
        WHERE legacy_details @> '{"sections":{"Parking and Entry":{"Parking Type":"On Street"}}}'`,
    );

    expect(rows).toEqual([{ uid: 401275 }]);
  });

  it("refuses to write details for a uid with no listing row", async () => {
    await expect(writeListingDetails(db, details(906200), [])).rejects.toThrow(
      "No listings row for uid 906200",
    );
  });
});

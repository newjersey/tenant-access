import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { handler } from "../../src/lambda/query-listings.js";
import { makeListing, seedListing, testClient, truncateAll } from "./support.js";

const EXPECTED_KEYS = [
  "uid",
  "lastUpdated",
  "name",
  "address",
  "city",
  "state",
  "zipCode",
  "rent",
  "rentMax",
  "bedrooms",
  "bathrooms",
  "unitType",
  "imageId",
  "imageUrl",
  "phoneNumber",
  "website",
  "description",
  "isWaitlistOpen",
  "amenities",
  "contactName",
  "contactOrganization",
  "fullListingUrl",
  "rentType",
  "depositRange",
];

type QueryBody = {
  success: boolean;
  count?: number;
  listings?: Record<string, unknown>[];
  error?: string | false;
};

let db: Client;

beforeAll(async () => {
  db = await testClient();
});

afterAll(async () => {
  await db.end();
});

beforeEach(async () => {
  await truncateAll(db);
});

async function query() {
  const response = await handler();
  return { statusCode: response.statusCode, ...(JSON.parse(response.body) as QueryBody) };
}

function uids(result: QueryBody) {
  return (result.listings ?? []).map((row) => row.uid);
}

describe("query-listings against a real database", () => {
  it("returns every column the frontend expects, camelCased", async () => {
    await seedListing(db, makeListing(100));

    const result = await query();

    expect(result).toMatchObject({ statusCode: 200, success: true, count: 1 });
    // The aliases in listing-columns.ts are double-quoted. Unquoted, Postgres
    // would fold them to lowercase and every camelCase field would read as
    // undefined in the app, with no error anywhere to notice it.
    const keys = Object.keys((result.listings ?? [])[0] ?? {});
    expect(keys.sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it("orders by uid ascending regardless of insertion order", async () => {
    for (const uid of [300, 100, 200]) {
      await seedListing(db, makeListing(uid));
    }

    const result = await query();

    expect(uids(result)).toEqual([100, 200, 300]);
  });

  it("includes hidden listings, unlike the public search endpoint", async () => {
    await seedListing(db, makeListing(100));
    await seedListing(db, makeListing(200), { shownToPublic: false });

    const result = await query();

    // Direct invocation is the only window into a VPC-bound database, so this
    // lambda deliberately has no `WHERE shown_to_public`. search-listings does.
    expect(result.count).toBe(2);
    expect(uids(result)).toEqual([100, 200]);
  });

  it("returns an empty list rather than failing on an empty table", async () => {
    const result = await query();

    expect(result).toMatchObject({ statusCode: 200, count: 0, listings: [] });
  });

  it("pins how Postgres types arrive in the response body", async () => {
    await seedListing(
      db,
      makeListing(100, {
        rent: 1500,
        bathrooms: 1.5,
        amenities: ["No Smoking", "Laundry"],
        isWaitlistOpen: true,
      }),
    );

    const [row] = (await query()).listings ?? [];

    expect(row.rent).toBe(1500);
    expect(row.amenities).toEqual(["No Smoking", "Laundry"]);
    expect(row.isWaitlistOpen).toBe(true);
    // node-postgres returns DECIMAL as a string to avoid precision loss, so
    // bathrooms arrives as "1.5", not 1.5. The mocked unit test hands back a
    // number and cannot see this.
    expect(row.bathrooms).toBe("1.5");
  });

  it("returns 500 when the schema no longer matches the query", async () => {
    // Stands in for a migration dropping a column the SELECT still names.
    await db.query("ALTER TABLE listings DROP COLUMN website");

    try {
      const result = await query();

      expect(result.statusCode).toBe(500);
      expect(String(result.error)).toMatch(/column "?website"? does not exist/);
    } finally {
      await db.query("ALTER TABLE listings ADD COLUMN website TEXT");
    }
  });
});

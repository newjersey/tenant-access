import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { handler } from "../../src/lambda/query-listings.js";
import { makeListing, seedListing, testClient, truncateAll } from "./support.js";

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
  it("includes hidden listings, unlike the public search endpoint", async () => {
    await seedListing(db, makeListing(100));
    await seedListing(db, makeListing(200), { shownToPublic: false });

    const result = await query();

    expect(result.count).toBe(2);
    expect(uids(result)).toEqual([100, 200]);
  });

  it("returns 500 when the schema no longer matches the query", async () => {
    // Stands in for a migration dropping a column the SELECT still names.
    await db.query("ALTER TABLE listings DROP COLUMN website");

    try {
      const result = await query();

      expect(result.statusCode).toBe(500);
      expect(String(result.error)).toMatch(/column "?website"? does not exist/);
    } finally {
      // put the column back in to clean up
      await db.query("ALTER TABLE listings ADD COLUMN website TEXT");
    }
  });
});

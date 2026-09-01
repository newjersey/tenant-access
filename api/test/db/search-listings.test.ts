import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getPool } from "../../src/lambda/db.js";
import { handler } from "../../src/lambda/search-listings.js";
import {
  makeListing,
  seedListing,
  seedManyListings,
  TEST_DB_ENV,
  testClient,
  truncateAll,
} from "./support.js";

type SearchBody = {
  success: boolean;
  listings?: Record<string, unknown>[];
  pagination?: { page: number; pageSize: number; total: number };
  error?: string;
};

let db: Client;

beforeAll(async () => {
  db = await testClient();
});

afterAll(async () => {
  // getPool caches a pool with idleTimeoutMillis: 0, so nothing else ever
  // closes these connections and vitest would hang waiting on them.
  const pool = await getPool();
  await pool.end();
  await db.end();
});

beforeEach(async () => {
  await truncateAll(db);
});

async function invoke(event: APIGatewayProxyEventV2) {
  const response = (await handler(event)) as {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
  return response;
}

async function search(params: Record<string, string> = {}) {
  const event = {
    headers: { "x-origin-secret": TEST_DB_ENV.ORIGIN_SECRET },
    queryStringParameters: params,
  } as unknown as APIGatewayProxyEventV2;

  const response = await invoke(event);
  return { ...response, ...(JSON.parse(response.body) as SearchBody) };
}

function uids(result: SearchBody) {
  return (result.listings ?? []).map((row) => row.uid);
}

describe("search-listings against a real database", () => {
  it("returns every visible listing when no location is given", async () => {
    await seedListing(db, makeListing(100, { city: "Newark" }));
    await seedListing(db, makeListing(200, { city: "Trenton" }));

    const result = await search();

    expect(result.statusCode).toBe(200);
    expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 2 });
    expect(result.headers["Cache-Control"]).toBe("public, max-age=300");
  });

  it("matches a city case-insensitively", async () => {
    await seedListing(db, makeListing(100, { city: "Jersey City" }));
    await seedListing(db, makeListing(200, { city: "Newark" }));

    const result = await search({ location: "jersey city" });

    expect(uids(result)).toEqual([100]);
  });

  it("excludes listings hidden from the public", async () => {
    await seedListing(db, makeListing(100, { city: "Newark" }));
    await seedListing(db, makeListing(200, { city: "Newark" }), { shownToPublic: false });

    const result = await search({ location: "Newark" });

    expect(uids(result)).toEqual([100]);
    expect(result.pagination?.total).toBe(1);
  });

  it("resolves a county to the cities inside it", async () => {
    await seedListing(db, makeListing(100, { city: "Somerville" }));
    await seedListing(db, makeListing(200, { city: "Bridgewater" }));
    await seedListing(db, makeListing(300, { city: "Newark" }));

    const result = await search({ location: "Somerset County" });

    expect(uids(result)).toEqual([100, 200]);
  });

  it("does not confuse a county with the city that shares its name", async () => {
    // "Warren" is a city in Somerset County. "Warren County" is somewhere else
    // entirely, and Phillipsburg is in it.
    await seedListing(db, makeListing(100, { city: "Warren" }));
    await seedListing(db, makeListing(200, { city: "Phillipsburg" }));

    expect(uids(await search({ location: "Warren County" }))).toEqual([200]);
    expect(uids(await search({ location: "Warren" }))).toEqual([100]);
  });

  it("returns an empty page when nothing matches", async () => {
    await seedListing(db, makeListing(100, { city: "Newark" }));

    const county = await search({ location: "Cape May County" });
    expect(county.listings).toEqual([]);
    expect(county.pagination?.total).toBe(0);

    const nowhere = await search({ location: "Nowhere" });
    expect(nowhere.listings).toEqual([]);
    expect(nowhere.pagination?.total).toBe(0);
  });

  it("orders by last_updated descending with nulls last", async () => {
    await seedListing(db, makeListing(100, { lastUpdated: "2026-01-01" }));
    await seedListing(db, makeListing(200, { lastUpdated: null }));
    await seedListing(db, makeListing(300, { lastUpdated: "2026-06-01" }));

    const result = await search();

    // Postgres defaults DESC to NULLS FIRST, so NULLS LAST is doing real work.
    expect(uids(result)).toEqual([300, 100, 200]);
  });

  it("breaks last_updated ties by ascending uid so pages stay stable", async () => {
    for (const uid of [300, 100, 200]) {
      await seedListing(db, makeListing(uid, { lastUpdated: "2026-05-01" }));
    }

    const result = await search();

    expect(uids(result)).toEqual([100, 200, 300]);
  });

  it("pages through results while reporting the full total", async () => {
    await seedManyListings(db, 25);

    const first = await search({ page: "1" });
    expect(first.listings).toHaveLength(20);
    expect(first.pagination).toEqual({ page: 1, pageSize: 20, total: 25 });

    const second = await search({ page: "2" });
    expect(second.listings).toHaveLength(5);
    expect(second.pagination?.total).toBe(25);

    // No row appears on both pages -- what the uid tiebreak is for.
    const firstPage = uids(first);
    expect(uids(second).some((uid) => firstPage.includes(uid))).toBe(false);
  });

  it("returns an empty page past the end of the results", async () => {
    await seedManyListings(db, 25);

    const result = await search({ page: "3" });

    expect(result.listings).toEqual([]);
    expect(result.pagination?.total).toBe(25);
  });

  it("stops counting at the result cap", async () => {
    await seedManyListings(db, 1100);

    const result = await search();

    // COUNT_SQL wraps the query in LIMIT 1001 so the frontend can say "over
    // 1000 results" without counting the whole catalog.
    expect(result.pagination?.total).toBe(1001);
    expect(result.listings).toHaveLength(20);
  });

  it("returns a generic 500 without leaking the database error", async () => {
    await seedListing(db, makeListing(100));
    await db.query("ALTER TABLE listings DROP COLUMN website");

    try {
      const result = await search();

      expect(result.statusCode).toBe(500);
      expect(result.error).toBe("Unable to search listings");
      expect(result.body).not.toContain("website");
      expect(result.headers["Cache-Control"]).toBe("no-store");
    } finally {
      await db.query("ALTER TABLE listings ADD COLUMN website TEXT");
    }
  });
});

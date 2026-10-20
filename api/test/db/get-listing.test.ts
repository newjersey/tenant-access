import type { APIGatewayProxyEvent } from "aws-lambda";
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getPool } from "../../src/lambda/db.js";
import { handler } from "../../src/lambda/get-listing.js";
import { makeListing, seedListing, testClient, truncateAll } from "./support.js";

let db: Client;

beforeAll(async () => {
  db = await testClient();
});

afterAll(async () => {
  const pool = await getPool();
  await pool.end();
  await db.end();
});

beforeEach(async () => {
  await truncateAll(db);
});

type ListingBody = {
  success: boolean;
  listing?: Record<string, unknown>;
  error?: string;
};

async function getListing(uid: string) {
  const event = { headers: {}, pathParameters: { uid } } as unknown as APIGatewayProxyEvent;
  const response = (await handler(event)) as {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
  return { ...response, ...(JSON.parse(response.body) as ListingBody) };
}

describe("get-listing against a real database", () => {
  it("returns the full listing in the same shape search uses", async () => {
    await seedListing(db, makeListing(100, { city: "Newark", amenities: ["Laundry"] }));

    const result = await getListing("100");

    expect(result.statusCode).toBe(200);
    expect(result.listing).toMatchObject({
      uid: 100,
      city: "Newark",
      zipCode: "08608",
      amenities: ["Laundry"],
      photoKeys: [],
      legacyDetails: null,
    });
  });

  it("404s a listing hidden from the public", async () => {
    await seedListing(db, makeListing(100), { shownToPublic: false });

    const result = await getListing("100");

    expect(result.statusCode).toBe(404);
  });

  it("404s a uid that doesn't exist", async () => {
    await seedListing(db, makeListing(100));

    const result = await getListing("200");

    expect(result.statusCode).toBe(404);
  });

  it("404s rather than 500s at the INTEGER boundary", async () => {
    const largest = await getListing("999999999");
    const overflow = await getListing("2147483648");

    expect(largest.statusCode).toBe(404);
    expect(overflow.statusCode).toBe(404);
  });

  it("returns a generic 500 without leaking the database error", async () => {
    await seedListing(db, makeListing(100));
    await db.query("ALTER TABLE listings DROP COLUMN website");

    try {
      const result = await getListing("100");

      expect(result.statusCode).toBe(500);
      expect(result.error).toBe("Unable to load listing");
      expect(result.body).not.toContain("website");
      expect(result.headers["Cache-Control"]).toBe("no-store");
    } finally {
      await db.query("ALTER TABLE listings ADD COLUMN website TEXT");
    }
  });
});

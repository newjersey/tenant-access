import type { S3Event } from "aws-lambda";
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing } from "../../src/scraper/parser.js";
import { makeListing, testClient, truncateAll } from "./support.js";

const { s3Body } = vi.hoisted(() => ({ s3Body: { json: "[]" } }));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = async () => ({ Body: { transformToString: async () => s3Body.json } });
  },
  GetObjectCommand: class {},
}));

const { handler } = await import("../../src/lambda/update-listings.js");

const EVENT = {
  Records: [{ s3: { object: { key: "parsed/2026-09-01.json" } } }],
} as unknown as S3Event;

// The safety floor only admits runs of at least MIN_ABSOLUTE_LISTINGS rows,
// so fixtures have to be catalog-sized. 1200 also exercises BATCH_SIZE batching.
const FULL = Array.from({ length: 1200 }, (_, index) => makeListing(1000 + index));

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

async function runUpdate(listings: Listing[]) {
  s3Body.json = JSON.stringify(listings);
  const response = await handler(EVENT);
  const body = JSON.parse(response.body) as {
    success: boolean;
    upserted?: number;
    hidden?: number;
    restored?: number;
    error?: string | false;
  };
  return { statusCode: response.statusCode, ...body };
}

async function visibleUids(): Promise<number[]> {
  const { rows } = await db.query<{ uid: number }>(
    "SELECT uid FROM listings WHERE shown_to_public ORDER BY uid",
  );
  return rows.map((row) => row.uid);
}

async function totalRows(): Promise<number> {
  const { rows } = await db.query<{ count: string }>("SELECT COUNT(*) AS count FROM listings");
  return Number(rows[0].count);
}

describe("update-listings against a real database", () => {
  it("hides listings that leave the feed and restores them when they come back", async () => {
    const first = await runUpdate(FULL);
    expect(first).toMatchObject({ statusCode: 200, upserted: 1200, hidden: 0, restored: 0 });
    expect(await visibleUids()).toHaveLength(1200);

    const shrunk = FULL.slice(0, 1100);
    const second = await runUpdate(shrunk);
    expect(second).toMatchObject({ statusCode: 200, hidden: 100, restored: 0 });
    expect(await visibleUids()).toEqual(shrunk.map((listing) => listing.uid));

    // Hidden, not deleted -- which is what makes the restore below possible.
    expect(await totalRows()).toBe(1200);

    const third = await runUpdate(FULL);
    expect(third).toMatchObject({ statusCode: 200, hidden: 0, restored: 100 });
    expect(await visibleUids()).toHaveLength(1200);
  });

  it("leaves the catalog untouched when a run falls under the safety floor", async () => {
    await runUpdate(FULL);

    const truncated = await runUpdate(FULL.slice(0, 500));
    expect(truncated.statusCode).toBe(500);
    expect(String(truncated.error)).toContain("below safety floor");

    // The rollback held: yesterday's catalog is still being served.
    expect(await visibleUids()).toHaveLength(1200);
  });

  it("overwrites changed fields on re-scrape and bumps scraped_at", async () => {
    await runUpdate(FULL);
    const before = await db.query<{ rent: number; scraped_at: Date }>(
      "SELECT rent, scraped_at FROM listings WHERE uid = 1000",
    );

    await runUpdate([makeListing(1000, { rent: 2100, name: "Renamed" }), ...FULL.slice(1)]);
    const after = await db.query<{ rent: number; name: string; scraped_at: Date }>(
      "SELECT rent, name, scraped_at FROM listings WHERE uid = 1000",
    );

    expect(after.rows[0].rent).toBe(2100);
    expect(after.rows[0].name).toBe("Renamed");
    expect(after.rows[0].scraped_at.getTime()).toBeGreaterThan(before.rows[0].scraped_at.getTime());
  });
});

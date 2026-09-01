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
  it("hides listings that leave the feed", async () => {
    const first = await runUpdate(FULL);
    expect(first).toMatchObject({ statusCode: 200, upserted: 1200, hidden: 0, restored: 0 });
    expect(await visibleUids()).toHaveLength(1200);

    const shrunk = FULL.slice(0, 1100);
    const second = await runUpdate(shrunk);
    expect(second).toMatchObject({ statusCode: 200, hidden: 100, restored: 0 });
    expect(await visibleUids()).toHaveLength(1100);
    expect(await totalRows()).toBe(1200);
  });

  it("leaves the catalog untouched when a run falls under the safety floor", async () => {
    await runUpdate(FULL);

    await expect(runUpdate(FULL.slice(0, 500))).rejects.toThrow("below safety floor");

    // The rollback held: yesterday's catalog is still being served.
    expect(await visibleUids()).toHaveLength(1200);
  });
});

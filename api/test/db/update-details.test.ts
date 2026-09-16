import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { S3Event } from "aws-lambda";
import type { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { parseListingDetail } from "../../src/scraper/detail-parser.js";
import { makeListing, seedListing, testClient, truncateAll } from "./support.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures");

const { objects } = vi.hoisted(() => ({ objects: new Map<string, string>() }));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = async (command: { input: { Key: string } }) => {
      const body = objects.get(command.input.Key);
      return { Body: body === undefined ? undefined : { transformToString: async () => body } };
    };
  },
  GetObjectCommand: class {
    constructor(public input: { Bucket: string; Key: string }) {}
  },
}));

const { handler } = await import("../../src/lambda/update-details.js");

// reproduces the parse-details and upload-to-s3 steps
function stage(uid: number, photoKeys: string[] = []) {
  const html = readFileSync(join(FIXTURES, `legacy-listing-${uid}.html`), "utf-8");
  const details = parseListingDetail(html, uid);
  const key = `details/${uid}.json`;
  objects.set(key, JSON.stringify({ details, photoKeys }));
  return key;
}

function event(...keys: string[]): S3Event {
  return { Records: keys.map((key) => ({ s3: { object: { key } } })) } as unknown as S3Event;
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
  process.env.BUCKET_NAME = "test-bucket";
  objects.clear();
  vi.spyOn(console, "log").mockImplementation(() => {});
  await truncateAll(db);
  await seedListing(db, makeListing(1229408));
  await seedListing(db, makeListing(401275));
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function read(uid: number) {
  const { rows } = await db.query(
    `SELECT legacy_details AS details, photo_keys AS keys, details_scraped_at AS scraped
        FROM listings WHERE uid = $1`,
    [uid],
  );
  return rows[0];
}

describe("update-details against a real database", () => {
  it("fills in the detail columns from the staged JSON", async () => {
    const result = await handler(event(stage(1229408, PHOTO_KEYS)));

    expect(JSON.parse(result.body)).toEqual({ success: true, written: 1 });

    const row = await read(1229408);
    expect(row.keys).toEqual(PHOTO_KEYS);
    expect(row.scraped).not.toBeNull();
    expect(row.details).toMatchObject({ availability: "Waiting List", yearBuilt: 2022 });
  });

  it("records an empty photo list for a listing with no photos", async () => {
    await handler(event(stage(401275)));

    expect(await read(401275)).toMatchObject({
      keys: [],
      details: { availability: "Under Construction" },
    });
  });

  it("reuses one connection across every record in the event", async () => {
    await handler(event(stage(401275), stage(1229408, PHOTO_KEYS)));

    expect((await read(401275)).scraped).not.toBeNull();
    expect((await read(1229408)).scraped).not.toBeNull();
  });

  it("fails the event when the JSON names a uid with no listing row", async () => {
    await expect(handler(event(stage(906200)))).rejects.toThrow("No listings row for uid 906200");
  });

  it("fails the event when the object is missing", async () => {
    await expect(handler(event("details/1229408.json"))).rejects.toThrow(
      "Empty body for details/1229408.json",
    );
    expect((await read(1229408)).scraped).toBeNull();
  });

  it("throws when BUCKET_NAME is unset", async () => {
    delete process.env.BUCKET_NAME;

    await expect(handler(event(stage(1229408)))).rejects.toThrow("BUCKET_NAME is not set");
  });

  it("does nothing when the event carries no records", async () => {
    const result = await handler(event());

    expect(JSON.parse(result.body)).toMatchObject({ success: true, message: "No records" });
    expect((await read(1229408)).scraped).toBeNull();
  });
});

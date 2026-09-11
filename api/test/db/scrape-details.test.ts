import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SQSEvent } from "aws-lambda";
import type { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeListing, seedListing, testClient, truncateAll } from "./support.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures");

function fixture(uid: number): string {
  return readFileSync(join(FIXTURES, `legacy-listing-${uid}.html`), "utf-8");
}

const { puts } = vi.hoisted(() => ({ puts: [] as Record<string, unknown>[] }));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = async (command: { input: Record<string, unknown> }) => {
      puts.push(command.input);
      return {};
    };
  },
  PutObjectCommand: class {
    constructor(public input: Record<string, unknown>) {}
  },
}));

const { handler } = await import("../../src/lambda/scrape-details.js");

// a section we have never seen, and no availability line at all
const SURPRISING = `<html><body>
  <div class="tabularSection">
    <div class="tabularHeading">Specialized Information</div>
    <table class="tabularDetails"><tr><td class="tbL">Listing ID</td><td class="tbC">42</td></tr></table>
  </div>
  <div class="tabularSection">
    <div class="tabularHeading">Pickleball Amenities</div>
    <table class="tabularDetails"><tr><td class="tbL">Courts</td><td class="tbC">2</td></tr></table>
  </div>
</body></html>`;

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

/** Detail pages come from `pages`; any uid missing from it answers 503, as the real site does. */
function stubFetch(pages: Record<number, string>) {
  vi.stubGlobal("fetch", async (url: string) => {
    const detail = url.match(/ViewUnit\/(\d+)$/);
    if (!detail) {
      return {
        ok: true,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => JPEG.buffer,
      } as unknown as Response;
    }

    const html = pages[Number(detail[1])];
    if (html === undefined) {
      return { ok: false, status: 503, statusText: "Service Unavailable" } as unknown as Response;
    }
    return { ok: true, text: async () => html } as unknown as Response;
  });
}

function event(...uids: number[]): SQSEvent {
  return {
    Records: uids.map((uid) => ({ messageId: `msg-${uid}`, body: JSON.stringify({ uid }) })),
  } as unknown as SQSEvent;
}

let db: Client;

beforeAll(async () => {
  db = await testClient();
});

afterAll(async () => {
  await db.end();
});

beforeEach(async () => {
  process.env.IMAGES_BUCKET_NAME = "test-images-bucket";
  puts.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => {});
  await truncateAll(db);
  await seedListing(db, makeListing(1229408));
  await seedListing(db, makeListing(401275));
  await seedListing(db, makeListing(42));
});

afterEach(() => {
  vi.unstubAllGlobals();
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

describe("scrape-details against a real database", () => {
  it("uploads the photos and then writes the row that points at them", async () => {
    stubFetch({ 1229408: fixture(1229408) });

    expect(await handler(event(1229408))).toEqual({ scraped: 1 });
    expect(puts.map((put) => put.Key)).toEqual([
      "photos/1229408/2828661.jpg",
      "photos/1229408/2828664.jpg",
      "photos/1229408/2828665.jpg",
    ]);
    expect(puts[0]).toMatchObject({ Bucket: "test-images-bucket", ContentType: "image/jpeg" });

    const row = await read(1229408);
    expect(row.keys).toEqual(puts.map((put) => put.Key));
    expect(row.scraped).not.toBeNull();
    expect(row.details).toMatchObject({ availability: "Waiting List", yearBuilt: 2022 });
  });

  it("writes a listing that has no photos without touching the bucket", async () => {
    stubFetch({ 401275: fixture(401275) });
    await handler(event(401275));

    expect(puts).toEqual([]);
    expect(await read(401275)).toMatchObject({
      keys: [],
      details: { availability: "Under Construction" },
    });
  });

  it("reuses one connection across every message in the event", async () => {
    stubFetch({ 401275: fixture(401275), 1229408: fixture(1229408) });

    expect(await handler(event(401275, 1229408))).toEqual({ scraped: 2 });
    expect((await read(401275)).scraped).not.toBeNull();
    expect((await read(1229408)).scraped).not.toBeNull();
  });

  it("flags a section and a missing availability we did not anticipate", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch({ 42: SURPRISING });

    await handler(event(42));

    expect(warn).toHaveBeenCalledWith("uid 42: unrecognized section(s): Pickleball Amenities");
    expect(warn).toHaveBeenCalledWith("uid 42: no availability found");
    // still stored: an unknown section is a cue to look, not a reason to drop the listing
    expect((await read(42)).details.sections["Pickleball Amenities"]).toEqual({ Courts: "2" });
  });

  it("fails the message when the detail page is unavailable", async () => {
    stubFetch({});

    await expect(handler(event(1229408))).rejects.toThrow("Detail fetch failed: 503");
    expect((await read(1229408)).scraped).toBeNull();
  });

  it("fails the message when the body is not a uid", async () => {
    stubFetch({});
    const malformed = {
      Records: [{ messageId: "msg-bad", body: '{"uid":"1229408"}' }],
    } as unknown as SQSEvent;

    await expect(handler(malformed)).rejects.toThrow('Expected {"uid": <integer>} in msg-bad');
  });

  it("refuses to run without a bucket to upload to", async () => {
    process.env.IMAGES_BUCKET_NAME = "";
    stubFetch({});

    await expect(handler(event(1229408))).rejects.toThrow("IMAGES_BUCKET_NAME is not set");
  });
});

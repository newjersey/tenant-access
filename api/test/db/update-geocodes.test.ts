import type { S3Event } from "aws-lambda";
import type { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeListing, seedListing, testClient, truncateAll } from "./support.js";

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

const { handler } = await import("../../src/lambda/update-geocodes.js");

const EXACT = { uid: 100, match: "exact", latitude: 40.22, longitude: -74.76 };
const NON_EXACT = { uid: 200, match: "non_exact", latitude: 40.72, longitude: -74.08 };
const NO_MATCH = { uid: 300, match: "no_match", latitude: null, longitude: null };

function stage(key: string, geocodes: unknown) {
  objects.set(key, JSON.stringify(geocodes));
  return key;
}

function event(...keys: string[]): S3Event {
  return { Records: keys.map((key) => ({ s3: { object: { key } } })) } as unknown as S3Event;
}

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
  vi.spyOn(console, "warn").mockImplementation(() => {});
  await truncateAll(db);
  for (const uid of [100, 200, 300]) await seedListing(db, makeListing(uid));
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function read(uid: number) {
  const { rows } = await db.query(
    `SELECT latitude, longitude, geocode_match AS match, geocoded_at AS at
       FROM listings WHERE uid = $1`,
    [uid],
  );
  return rows[0];
}

describe("update-geocodes against a real database", () => {
  it("writes a single-listing file", async () => {
    const result = await handler(event(stage("geocode/100.json", [EXACT])));

    expect(JSON.parse(result.body)).toEqual({ success: true, written: 1 });
    expect(await read(100)).toMatchObject({ latitude: 40.22, longitude: -74.76, match: "exact" });
    expect((await read(100)).at).not.toBeNull();
    expect((await read(200)).at).toBeNull();
  });

  it("writes every listing in a batch file in one go", async () => {
    await handler(event(stage("geocode/all.json", [EXACT, NON_EXACT, NO_MATCH])));

    expect(await read(200)).toMatchObject({ latitude: 40.72, match: "non_exact" });
    expect((await read(300)).match).toBe("no_match");
    expect((await read(300)).at).not.toBeNull();
  });

  it("puts a no_match listing at its city's center", async () => {
    await seedListing(db, makeListing(400, { city: "NEWARK" }));

    await handler(event(stage("geocode/all.json", [NO_MATCH, { ...NO_MATCH, uid: 400 }])));

    expect(await read(300)).toMatchObject({ latitude: 40.24934, longitude: -74.789968 });
    expect(await read(400)).toMatchObject({ latitude: 40.735659, longitude: -74.173605 });
  });

  it("ignores coordinates sent with a no_match", async () => {
    await handler(
      event(stage("geocode/300.json", [{ ...NO_MATCH, latitude: 40, longitude: -74 }])),
    );

    expect(await read(300)).toMatchObject({ latitude: 40.24934, longitude: -74.789968 });
  });

  it("replaces an earlier geocode", async () => {
    await handler(event(stage("geocode/300.json", [NO_MATCH])));
    await handler(event(stage("geocode/300.json", [{ ...EXACT, uid: 300 }])));

    expect(await read(300)).toMatchObject({ latitude: 40.22, longitude: -74.76, match: "exact" });
  });

  it("skips uids with no listings row and writes the rest", async () => {
    const key = stage("geocode/all.json", [EXACT, { ...EXACT, uid: 999 }]);

    const result = await handler(event(key));

    expect(JSON.parse(result.body)).toEqual({ success: true, written: 1 });
    expect(console.warn).toHaveBeenCalledWith("geocode/all.json: 1 uid(s) had no listings row");
    expect((await read(100)).match).toBe("exact");
  });

  it.each([
    ["a match without coordinates", { ...EXACT, uid: 200, latitude: null, longitude: null }],
    ["a no_match in a city with no center", NO_MATCH],
  ])("writes nothing from a file with %s", async (_name, geocode) => {
    await db.query("UPDATE listings SET city = 'Atlantis' WHERE uid = 300");

    const key = stage("geocode/all.json", [EXACT, geocode]);

    await expect(handler(event(key))).rejects.toThrow("listings_coords_match_check");
    expect((await read(100)).at).toBeNull();
  });

  it.each([
    ["not an array", { uid: 100 }, "Expected a JSON array in geocode/x.json"],
    ["a bad entry", [EXACT, { uid: 200 }], "Invalid geocode at index 1 in geocode/x.json"],
    ["a repeated uid", [EXACT, EXACT], "Duplicate uid 100 in geocode/x.json"],
  ])("writes nothing from a file that is %s", async (_name, body, message) => {
    await expect(handler(event(stage("geocode/x.json", body)))).rejects.toThrow(message);
    expect((await read(100)).at).toBeNull();
  });

  it("decodes keys the way S3 events encode them", async () => {
    stage("geocode/all 2026.json", [EXACT]);

    await handler(event("geocode/all+2026.json"));

    expect((await read(100)).match).toBe("exact");
  });

  it("fails the event when the object is missing", async () => {
    await expect(handler(event("geocode/100.json"))).rejects.toThrow(
      "Empty body for geocode/100.json",
    );
  });

  it("throws when BUCKET_NAME is unset", async () => {
    delete process.env.BUCKET_NAME;

    await expect(handler(event(stage("geocode/100.json", [EXACT])))).rejects.toThrow(
      "BUCKET_NAME is not set",
    );
  });

  it("does nothing when the event carries no records", async () => {
    const result = await handler(event());

    expect(JSON.parse(result.body)).toMatchObject({ success: true, message: "No records" });
  });
});

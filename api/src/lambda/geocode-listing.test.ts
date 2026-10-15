import type { S3Event } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GeocodeAddress } from "../geocoder/census.js";

const { objects, puts, geocodeAddresses } = vi.hoisted(() => ({
  objects: new Map<string, string>(),
  puts: [] as Record<string, unknown>[],
  geocodeAddresses: vi.fn(async (addresses: GeocodeAddress[]) =>
    addresses.map(({ uid }) => ({ uid, match: "exact", latitude: 40.22, longitude: -74.76 })),
  ),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = async (command: { input: { Key: string; Body?: string } }) => {
      if (command.input.Body !== undefined) {
        puts.push(command.input);
        return {};
      }
      const body = objects.get(command.input.Key);
      return { Body: body === undefined ? undefined : { transformToString: async () => body } };
    };
  },
  GetObjectCommand: class {
    constructor(public input: Record<string, unknown>) {}
  },
  PutObjectCommand: class {
    constructor(public input: Record<string, unknown>) {}
  },
}));
vi.mock("../geocoder/census.js", () => ({ geocodeAddresses }));

const { handler } = await import("./geocode-listing.js");

function address(uid: number): GeocodeAddress {
  return { uid, address: `${uid} Cook Avenue`, city: "Madison", state: "NJ", zipCode: "07940" };
}

function stage(key: string, body: unknown) {
  objects.set(key, JSON.stringify(body));
  return key;
}

function event(...keys: string[]): S3Event {
  return { Records: keys.map((key) => ({ s3: { object: { key } } })) } as unknown as S3Event;
}

beforeEach(() => {
  process.env.BUCKET_NAME = "data";
  delete process.env.GEOCODE_PREFIX;
  objects.clear();
  puts.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("geocode-listing handler", () => {
  it("geocodes a request file and writes the results under geocode/", async () => {
    const key = stage("geocode-requests/2026-10-15.json", [address(1), address(2)]);

    const result = await handler(event(key));

    expect(geocodeAddresses).toHaveBeenCalledWith([address(1), address(2)], 180_000);
    expect(result).toEqual({ geocoded: 2 });
    expect(puts).toEqual([
      {
        Bucket: "data",
        Key: "geocode/2026-10-15.json",
        Body: JSON.stringify([
          { uid: 1, match: "exact", latitude: 40.22, longitude: -74.76 },
          { uid: 2, match: "exact", latitude: 40.22, longitude: -74.76 },
        ]),
        ContentType: "application/json",
      },
    ]);
  });

  it("sends Census at most 1000 addresses at a time", async () => {
    const key = stage(
      "geocode-requests/all.json",
      Array.from({ length: 2500 }, (_, i) => address(i + 1)),
    );

    await handler(event(key));

    expect(geocodeAddresses.mock.calls.map(([chunk]) => chunk.length)).toEqual([1000, 1000, 500]);
    expect(JSON.parse(puts[0].Body as string)).toHaveLength(2500);
  });

  it("honors GEOCODE_PREFIX", async () => {
    process.env.GEOCODE_PREFIX = "elsewhere/";

    await handler(event(stage("geocode-requests/x.json", [address(1)])));

    expect(puts[0].Key).toBe("elsewhere/x.json");
  });

  it("decodes keys the way S3 events encode them", async () => {
    stage("geocode-requests/2026-10-15T04:00:00.000Z.json", [address(1)]);

    await handler(event("geocode-requests/2026-10-15T04%3A00%3A00.000Z.json"));

    expect(puts[0].Key).toBe("geocode/2026-10-15T04:00:00.000Z.json");
  });

  it.each([
    ["not an array", address(1), "Expected a JSON array in geocode-requests/x.json"],
    [
      "an entry without a uid",
      [address(1), { address: "1 Main St" }],
      "Invalid listing at index 1 in geocode-requests/x.json",
    ],
  ])("rejects a file that is %s", async (_name, body, message) => {
    await expect(handler(event(stage("geocode-requests/x.json", body)))).rejects.toThrow(message);
    expect(geocodeAddresses).not.toHaveBeenCalled();
  });

  it("writes nothing when any chunk fails to geocode", async () => {
    const key = stage(
      "geocode-requests/all.json",
      Array.from({ length: 1500 }, (_, i) => address(i + 1)),
    );
    geocodeAddresses
      .mockImplementationOnce(async (chunk) =>
        chunk.map(({ uid }) => ({ uid, match: "exact", latitude: 40.22, longitude: -74.76 })),
      )
      .mockRejectedValueOnce(new Error("Census geocoder failed: 502 Bad Gateway"));

    await expect(handler(event(key))).rejects.toThrow("Census geocoder failed");
    expect(puts).toEqual([]);
  });

  it("fails the event when the object is missing", async () => {
    await expect(handler(event("geocode-requests/x.json"))).rejects.toThrow(
      "Empty body for geocode-requests/x.json",
    );
  });

  it("throws when BUCKET_NAME is unset", async () => {
    delete process.env.BUCKET_NAME;

    await expect(handler(event("geocode-requests/x.json"))).rejects.toThrow(
      "BUCKET_NAME is not set",
    );
  });
});

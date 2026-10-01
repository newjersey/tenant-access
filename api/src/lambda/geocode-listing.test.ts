import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GeocodeAddress } from "../geocoder/census.js";

const { puts, geocodeAddresses } = vi.hoisted(() => ({
  puts: [] as Record<string, unknown>[],
  geocodeAddresses: vi.fn(async (addresses: GeocodeAddress[]) =>
    addresses.map(({ uid }) => ({ uid, match: "exact", latitude: 40.22, longitude: -74.76 })),
  ),
}));

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
vi.mock("../geocoder/census.js", () => ({ geocodeAddresses }));

const { handler } = await import("./geocode-listing.js");

const LISTING: GeocodeAddress = {
  uid: 1388803,
  address: "44 Cook Avenue",
  city: "Madison",
  state: "NJ",
  zipCode: "07940",
};

beforeEach(() => {
  process.env.BUCKET_NAME = "data";
  delete process.env.GEOCODE_PREFIX;
  puts.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("geocode-listing handler", () => {
  it("geocodes the listing and leaves a one-entry JSON array in geocode/", async () => {
    const result = await handler(LISTING);

    expect(geocodeAddresses).toHaveBeenCalledWith([LISTING]);
    expect(result).toEqual({ uid: 1388803, match: "exact", latitude: 40.22, longitude: -74.76 });
    expect(puts).toEqual([
      {
        Bucket: "data",
        Key: "geocode/1388803.json",
        Body: JSON.stringify([result]),
        ContentType: "application/json",
      },
    ]);
  });

  it("honors GEOCODE_PREFIX", async () => {
    process.env.GEOCODE_PREFIX = "elsewhere/";

    await handler(LISTING);

    expect(puts[0].Key).toBe("elsewhere/1388803.json");
  });

  it("rejects an event that isn't a listing", async () => {
    await expect(handler({} as GeocodeAddress)).rejects.toThrow(
      "Expected a listing with uid and address",
    );
    expect(geocodeAddresses).not.toHaveBeenCalled();
  });

  it("writes nothing when the geocoder fails", async () => {
    geocodeAddresses.mockRejectedValueOnce(new Error("Census geocoder failed: 502 Bad Gateway"));

    await expect(handler(LISTING)).rejects.toThrow("Census geocoder failed");
    expect(puts).toEqual([]);
  });

  it("throws when BUCKET_NAME is unset", async () => {
    delete process.env.BUCKET_NAME;

    await expect(handler(LISTING)).rejects.toThrow("BUCKET_NAME is not set");
  });
});

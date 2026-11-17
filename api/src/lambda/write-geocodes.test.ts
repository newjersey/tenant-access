import type { Client } from "pg";
import { describe, expect, it, vi } from "vitest";
import type { Geocode } from "../geocoder/census.js";
import { parseGeocodes, writeGeocodes } from "./write-geocodes.js";

const EXACT: Geocode = { uid: 1, match: "exact", latitude: 40.22, longitude: -74.76 };
const NO_MATCH: Geocode = { uid: 2, match: "no_match", latitude: null, longitude: null };

describe("parseGeocodes", () => {
  it("accepts an array of geocodes", () => {
    expect(parseGeocodes(JSON.stringify([EXACT, NO_MATCH]), "geocode/x.json")).toEqual([
      EXACT,
      NO_MATCH,
    ]);
  });

  it("rejects anything but an array", () => {
    expect(() => parseGeocodes(JSON.stringify(EXACT), "geocode/x.json")).toThrow(
      "Expected a JSON array in geocode/x.json",
    );
  });

  it.each([
    ["a missing uid", { ...EXACT, uid: undefined }],
    ["an unknown match", { ...EXACT, match: "fuzzy" }],
    ["a string coordinate", { ...EXACT, latitude: "40.22" }],
    ["a missing coordinate", { uid: 1, match: "no_match", latitude: null }],
    ["null", null],
  ])("rejects %s", (_name, entry) => {
    expect(() => parseGeocodes(JSON.stringify([NO_MATCH, entry]), "geocode/x.json")).toThrow(
      "Invalid geocode at index 1 in geocode/x.json",
    );
  });

  it("rejects a uid listed twice", () => {
    expect(() => parseGeocodes(JSON.stringify([EXACT, EXACT]), "geocode/x.json")).toThrow(
      "Duplicate uid 1 in geocode/x.json",
    );
  });
});

describe("writeGeocodes", () => {
  it("binds one array per column and returns the updated count", async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 2 });

    const updated = await writeGeocodes({ query } as unknown as Client, [EXACT, NO_MATCH]);

    expect(updated).toBe(2);
    expect(query.mock.calls[0][1]).toEqual([
      [1, 2],
      ["exact", "no_match"],
      [40.22, null],
      [-74.76, null],
    ]);
  });
});

import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeListing, seedListing, testClient, truncateAll } from "./support.js";

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

async function milesBetweenCities(from: string, to: string): Promise<number> {
  const { rows } = await db.query<{ miles: number }>(
    `SELECT miles_between(a.latitude, a.longitude, b.latitude, b.longitude) AS miles
       FROM city_counties a, city_counties b
      WHERE a.city = $1 AND b.city = $2`,
    [from, to],
  );
  expect(rows).toHaveLength(1);
  return rows[0].miles;
}

describe("miles_between", () => {
  it("measures known distances between city centers", async () => {
    expect(await milesBetweenCities("Newark", "Trenton")).toBeCloseTo(47, 0);
    expect(await milesBetweenCities("Newark", "Jersey City")).toBeCloseTo(5, 0);
    expect(await milesBetweenCities("Newark", "Cape May")).toBeCloseTo(128, 0);
  });

  it("is symmetric and zero for the same point", async () => {
    expect(await milesBetweenCities("Trenton", "Newark")).toBe(
      await milesBetweenCities("Newark", "Trenton"),
    );
    expect(await milesBetweenCities("Newark", "Newark")).toBe(0);
  });

  it("returns NULL when any coordinate is NULL", async () => {
    const { rows } = await db.query(
      `SELECT miles_between(NULL, -74, 40, -74) AS a,
              miles_between(40, NULL, 40, -74) AS b,
              miles_between(40, -74, NULL, -74) AS c,
              miles_between(40, -74, 40, NULL) AS d`,
    );
    expect(rows[0]).toEqual({ a: null, b: null, c: null, d: null });
  });
});

describe("search centers", () => {
  // generous New Jersey bounding box; catches swapped lat/lng or a dropped minus sign
  const IN_NJ = `latitude BETWEEN 38.9 AND 41.4 AND longitude BETWEEN -75.6 AND -73.9`;

  it("gives every county a center inside New Jersey", async () => {
    const { rows } = await db.query(
      `SELECT count(*)::int AS total, count(*) FILTER (WHERE ${IN_NJ})::int AS in_nj FROM counties`,
    );
    expect(rows[0]).toEqual({ total: 21, in_nj: 21 });
  });

  it("gives every city a center inside New Jersey", async () => {
    const { rows } = await db.query(
      `SELECT count(*)::int AS total, count(*) FILTER (WHERE ${IN_NJ})::int AS in_nj FROM city_counties`,
    );
    expect(rows[0]).toEqual({ total: 353, in_nj: 353 });
  });

  it("puts every city near its own county's center", async () => {
    const { rows } = await db.query(
      `SELECT cc.city
         FROM city_counties cc
         JOIN counties c ON c.name = cc.county
        WHERE miles_between(cc.latitude, cc.longitude, c.latitude, c.longitude) > 25`,
    );
    expect(rows).toEqual([]);
  });
});

describe("listing geocode constraints", () => {
  async function setGeocode(fields: Record<string, unknown>) {
    await seedListing(db, makeListing(1));
    const columns = Object.keys(fields);
    const assignments = columns.map((column, i) => `${column} = $${i + 2}`).join(", ");
    return db.query(`UPDATE listings SET ${assignments} WHERE uid = $1`, [
      1,
      ...Object.values(fields),
    ]);
  }

  it("starts new listings un-geocoded", async () => {
    await seedListing(db, makeListing(1));
    const { rows } = await db.query(
      "SELECT latitude, longitude, geocoded_at, geocode_match FROM listings WHERE uid = 1",
    );
    expect(rows[0]).toEqual({
      latitude: null,
      longitude: null,
      geocoded_at: null,
      geocode_match: null,
    });
  });

  it("accepts a matched geocode with coordinates", async () => {
    await expect(
      setGeocode({
        latitude: 40.22,
        longitude: -74.76,
        geocode_match: "exact",
        geocoded_at: new Date(),
      }),
    ).resolves.toMatchObject({ rowCount: 1 });
  });

  it("rejects a latitude without a longitude", async () => {
    await expect(
      setGeocode({ latitude: 40.22, geocode_match: "exact", geocoded_at: new Date() }),
    ).rejects.toThrow(/listings_lat_lng_together_check/);
  });

  it("rejects an unknown match type", async () => {
    await expect(
      setGeocode({
        latitude: 40.22,
        longitude: -74.76,
        geocode_match: "fuzzy",
        geocoded_at: new Date(),
      }),
    ).rejects.toThrow(/listings_geocode_match_check/);
  });

  it("rejects a match without a geocoded_at", async () => {
    await expect(
      setGeocode({ latitude: 40.22, longitude: -74.76, geocode_match: "exact" }),
    ).rejects.toThrow(/listings_geocoded_at_with_match_check/);
  });

  it("rejects a match that has no coordinates when exact", async () => {
    await expect(setGeocode({ geocode_match: "exact", geocoded_at: new Date() })).rejects.toThrow(
      /listings_coords_match_check/,
    );
  });

  it("rejects a match that has no coordinates when no match", async () => {
    await expect(
      setGeocode({ geocode_match: "no_match", geocoded_at: new Date() }),
    ).rejects.toThrow(/listings_coords_match_check/);
  });
});

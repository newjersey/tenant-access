import type { Client } from "pg";
import type { Geocode } from "../geocoder/census.js";

const MATCHES = new Set(["exact", "non_exact", "no_match"]);

const SQL = `UPDATE listings l
  SET latitude = CASE WHEN g.match = 'no_match'
      THEN (SELECT cc.latitude FROM city_counties cc WHERE lower(cc.city) = lower(l.city))
      ELSE g.latitude END,
    longitude = CASE WHEN g.match = 'no_match'
      THEN (SELECT cc.longitude FROM city_counties cc WHERE lower(cc.city) = lower(l.city))
      ELSE g.longitude END,
    geocode_match = g.match,
    geocoded_at = NOW()
  FROM unnest($1::int[], $2::text[], $3::float8[], $4::float8[])
    AS g(uid, match, latitude, longitude)
  WHERE l.uid = g.uid`;

function isCoordinate(value: unknown): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

// Coordinate/match consistency is left to the listings CHECK constraints.
export function parseGeocodes(json: string, source: string): Geocode[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error(`Expected a JSON array in ${source}`);

  const seen = new Set<number>();
  parsed.forEach((entry: Partial<Geocode>, index) => {
    const valid =
      Number.isInteger(entry?.uid) &&
      MATCHES.has(entry.match as string) &&
      isCoordinate(entry.latitude) &&
      isCoordinate(entry.longitude);
    if (!valid) {
      throw new Error(`Invalid geocode at index ${index} in ${source}: ${JSON.stringify(entry)}`);
    }
    if (seen.has(entry.uid as number)) {
      throw new Error(`Duplicate uid ${entry.uid} in ${source}`);
    }
    seen.add(entry.uid as number);
  });

  return parsed as Geocode[];
}

// Returns how many listings were updated; uids with no listings row are skipped.
export async function writeGeocodes(client: Client, geocodes: Geocode[]): Promise<number> {
  const result = await client.query(SQL, [
    geocodes.map((g) => g.uid),
    geocodes.map((g) => g.match),
    geocodes.map((g) => g.latitude),
    geocodes.map((g) => g.longitude),
  ]);
  return result.rowCount ?? 0;
}

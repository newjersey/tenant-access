// One-time backfill: geocode every listing in a parsed/<date>/listings.json and
// print the JSON that update-geocodes expects. Upload the output to geocode/.
//
//   npx tsx scripts/geocode_all.ts listings.json > geocode-all.json
import { readFileSync } from "node:fs";
import { type Geocode, geocodeAddresses } from "../src/geocoder/census.js";
import type { Listing } from "../src/scraper/parser.js";

// the Census limit is 10,000 per file, but smaller files fail faster and cheaper
const CHUNK = 1000;

const path = process.argv[2];
if (!path) throw new Error("Usage: tsx scripts/geocode_all.ts <listings.json>");

const listings = JSON.parse(readFileSync(path, "utf-8")) as Listing[];
const geocodes: Geocode[] = [];

for (let start = 0; start < listings.length; start += CHUNK) {
  const chunk = listings.slice(start, start + CHUNK);
  geocodes.push(...(await geocodeAddresses(chunk, 10 * 60_000)));
  console.error(`Geocoded ${start + chunk.length} of ${listings.length}`);
}

const counts = new Map<string, number>();
for (const { match } of geocodes) counts.set(match, (counts.get(match) ?? 0) + 1);
console.error([...counts].map(([match, count]) => `${match}: ${count}`).join(", "));

console.log(JSON.stringify(geocodes));

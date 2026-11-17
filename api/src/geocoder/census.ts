import type { Listing } from "../scraper/parser.js";

const BATCH_URL = "https://geocoding.geo.census.gov/geocoder/locations/addressbatch";

export type GeocodeAddress = Pick<Listing, "uid" | "address" | "city" | "state" | "zipCode">;

export type GeocodeMatch = "exact" | "non_exact" | "no_match";

export interface Geocode {
  uid: number;
  match: GeocodeMatch;
  latitude: number | null;
  longitude: number | null;
}

function csvField(value: string | null): string {
  return `"${(value ?? "").replace(/[\r\n]+/g, " ").replace(/"/g, '""')}"`;
}

export function toCensusCsv(addresses: GeocodeAddress[]): string {
  return addresses
    .map(({ uid, address, city, state, zipCode }) =>
      [String(uid), address, city, state, zipCode].map(csvField).join(","),
    )
    .join("\n");
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes && char === '"' && line[i + 1] === '"') {
      field += '"'; // escaped quote
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }

  fields.push(field);
  return fields;
}

// Rows are "id","input address","Match","Exact","matched address","lng,lat",...
// or "id","input address","No_Match" (or "Tie"), not necessarily in input order.
function parseResultLine(line: string): Geocode {
  const [id, , status, exactness, , coordinates] = parseCsvLine(line);
  const uid = Number(id);
  if (!Number.isInteger(uid)) throw new Error(`Unexpected Census result row: ${line}`);

  if (status === "No_Match" || status === "Tie") {
    return { uid, match: "no_match", latitude: null, longitude: null };
  }

  const [longitude, latitude] = (coordinates ?? "").split(",").map(Number);
  if (status !== "Match" || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error(`Unexpected Census result row: ${line}`);
  }

  return { uid, match: exactness === "Exact" ? "exact" : "non_exact", latitude, longitude };
}

export function parseCensusResults(csv: string): Geocode[] {
  return csv
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map(parseResultLine);
}

export async function geocodeAddresses(
  addresses: GeocodeAddress[],
  timeoutMs = 30_000,
): Promise<Geocode[]> {
  const form = new FormData();
  form.append("addressFile", new Blob([toCensusCsv(addresses)]), "addresses.csv");
  form.append("benchmark", "Public_AR_Current");

  const response = await fetch(BATCH_URL, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Census geocoder failed: ${response.status} ${response.statusText}`);
  }

  const geocodes = parseCensusResults(await response.text());
  if (geocodes.length !== addresses.length) {
    throw new Error(`Census geocoder returned ${geocodes.length} of ${addresses.length} rows`);
  }

  return geocodes;
}

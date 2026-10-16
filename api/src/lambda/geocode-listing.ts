import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import { type Geocode, type GeocodeAddress, geocodeAddresses } from "../geocoder/census.js";

const s3 = new S3Client();

const CHUNK = 1000;
const CHUNK_TIMEOUT_MS = 3 * 60_000;

export function parseRequests(json: string, source: string): GeocodeAddress[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error(`Expected a JSON array in ${source}`);

  parsed.forEach((entry: Partial<GeocodeAddress>, index) => {
    if (!Number.isInteger(entry?.uid)) {
      throw new Error(`Invalid listing at index ${index} in ${source}: ${JSON.stringify(entry)}`);
    }
  });

  return parsed as GeocodeAddress[];
}

function summarize(geocodes: Geocode[]): string {
  const counts = new Map<string, number>();
  for (const { match } of geocodes) counts.set(match, (counts.get(match) ?? 0) + 1);
  return [...counts].map(([match, count]) => `${match}: ${count}`).join(", ");
}

export const handler = async (event: S3Event) => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) throw new Error("BUCKET_NAME is not set");
  const prefix = process.env.GEOCODE_PREFIX ?? "geocode/";

  let geocoded = 0;

  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!object.Body) throw new Error(`Empty body for ${key}`);

    const addresses = parseRequests(await object.Body.transformToString(), key);
    const geocodes: Geocode[] = [];

    for (let start = 0; start < addresses.length; start += CHUNK) {
      const chunk = addresses.slice(start, start + CHUNK);
      geocodes.push(...(await geocodeAddresses(chunk, CHUNK_TIMEOUT_MS)));
    }

    const resultKey = `${prefix}${key.split("/").pop()}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: resultKey,
        Body: JSON.stringify(geocodes),
        ContentType: "application/json",
      }),
    );

    geocoded += geocodes.length;
    console.log(`${key}: ${summarize(geocodes)}, wrote ${resultKey}`);
  }

  return { geocoded };
};

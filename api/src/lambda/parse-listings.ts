import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import { parseListings } from "../scraper/parser.js";

const s3 = new S3Client();

/** Pull the YYYY-MM-DD out of `raw/2026-08-18/listings.html`. */
function dateFromKey(key: string): string {
  const match = key.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) throw new Error(`No date found in key: ${key}`);
  return match[1];
}

export const handler = async (event: S3Event) => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) throw new Error("BUCKET_NAME is not set");

  const parsedPrefix = process.env.PARSED_PREFIX ?? "parsed/";
  const results = [];

  for (const record of event.Records) {
    // S3 event keys are URL-encoded; spaces arrive as '+'.
    const rawKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const date = dateFromKey(rawKey);

    console.log(`Parsing s3://${bucket}/${rawKey}`);
    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: rawKey }));
    if (!object.Body) throw new Error(`Empty body for ${rawKey}`);

    const html = await object.Body.transformToString();

    // Relative timestamps ("just updated", "updated this week") resolve against
    // the scrape date, so use the date in the key rather than today. Reparsing
    // an older raw file then yields the same output it did originally.
    const listings = parseListings(html, new Date(`${date}T00:00:00Z`));

    if (listings.length === 0) {
      throw new Error(`Parsed 0 listings from ${rawKey}; refusing to write an empty result`);
    }

    console.log(`Parsed ${listings.length} listing(s) from ${(html.length / 1e6).toFixed(1)}MB`);

    const listingsKey = `${parsedPrefix}${date}/listings.json`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: listingsKey,
        Body: JSON.stringify(listings),
        ContentType: "application/json",
      }),
    );

    console.log(`Wrote s3://${bucket}/${listingsKey}`);
    results.push({ key: listingsKey, count: listings.length });
  }

  return { parsed: results };
};

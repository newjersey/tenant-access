import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import { type Listing, type ParsedListings, parseListings } from "../scraper/parser.js";
import { decodeOnlyRecent, isRecentlyUpdated } from "../scraper/recency.js";

const s3 = new S3Client();

function dateFromKey(key: string): string {
  const match = key.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) throw new Error(`No date found in key: ${key}`);
  return match[1];
}

// put together ALL uids and only the listings to actually update
function toEnvelope(listings: Listing[], scrapeDate: Date, onlyRecent: boolean): ParsedListings {
  return {
    uids: listings.map((listing) => listing.uid),
    listings: onlyRecent
      ? listings.filter((listing) => isRecentlyUpdated(listing.lastUpdated, scrapeDate))
      : listings,
  };
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

    const onlyRecent = decodeOnlyRecent(object.Metadata);
    const html = await object.Body.transformToString();

    const scrapeDate = new Date(`${date}T00:00:00Z`);
    const parsed = parseListings(html, scrapeDate);

    if (parsed.length === 0) {
      throw new Error(`Parsed 0 listings from ${rawKey}; refusing to write an empty result`);
    }

    const envelope = toEnvelope(parsed, scrapeDate, onlyRecent);

    console.log(
      `Parsed ${envelope.uids.length} listing(s) from ${(html.length / 1e6).toFixed(1)}MB, ` +
        `${envelope.listings.length} to refresh (onlyRecent=${onlyRecent})`,
    );

    const listingsKey = `${parsedPrefix}${date}/listings.json`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: listingsKey,
        Body: JSON.stringify(envelope),
        ContentType: "application/json",
      }),
    );

    console.log(`Wrote s3://${bucket}/${listingsKey}`);
    results.push({
      key: listingsKey,
      count: envelope.uids.length,
      refresh: envelope.listings.length,
    });
  }

  return { parsed: results };
};

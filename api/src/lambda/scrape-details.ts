import { S3Client } from "@aws-sdk/client-s3";
import type { SQSEvent, SQSRecord } from "aws-lambda";
import { detailUrl, type ListingDetails, parseListingDetail } from "../scraper/detail-parser.js";
import { USER_AGENT } from "../scraper/source.js";
import { getClient } from "./db.js";
import { storePhotos } from "./photo-store.js";
import { writeListingDetails } from "./write-details.js";

const s3 = new S3Client();

const FETCH_TIMEOUT_MS = 30_000;

// could be more out there??
const KNOWN_SECTIONS = new Set([
  "Basic Features",
  "Appliances",
  "Utilities",
  "Specialized Information",
  "Accessibility",
  "Kitchen & Bath Accessibility",
  "Safety",
  "Parking and Entry",
  "Nearby Services",
  "Comments",
  "Contact",
]);

function audit(details: ListingDetails): void {
  const unknown = Object.keys(details.sections).filter((name) => !KNOWN_SECTIONS.has(name));
  if (unknown.length > 0) {
    console.warn(`uid ${details.uid}: unrecognized section(s): ${unknown.join(", ")}`);
  }
  if (details.availability === null) {
    console.warn(`uid ${details.uid}: no availability found`);
  }
}

function uidFrom(record: SQSRecord): number {
  const { uid } = JSON.parse(record.body) as { uid?: unknown };
  if (!Number.isInteger(uid)) {
    throw new Error(`Expected {"uid": <integer>} in ${record.messageId}, got ${record.body}`);
  }
  return uid as number;
}

async function fetchDetailPage(uid: number): Promise<string> {
  const url = detailUrl(uid);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });

  if (!response.ok) {
    throw new Error(`Detail fetch failed: ${response.status} ${response.statusText} for ${url}`);
  }

  return response.text();
}

async function scrapeOne(
  client: Awaited<ReturnType<typeof getClient>>,
  bucket: string,
  uid: number,
) {
  const details = parseListingDetail(await fetchDetailPage(uid), uid);
  audit(details);

  const photoKeys = await storePhotos(s3, bucket, uid, details.photoUrls);
  await writeListingDetails(client, details, photoKeys);

  console.log(`uid ${uid}: wrote details and ${photoKeys.length} photo key(s)`);
}

export const handler = async (event: SQSEvent) => {
  const bucket = process.env.IMAGES_BUCKET_NAME;
  if (!bucket) throw new Error("IMAGES_BUCKET_NAME is not set");

  const client = await getClient();

  try {
    for (const record of event.Records) {
      await scrapeOne(client, bucket, uidFrom(record));
    }
  } finally {
    await client.end();
  }

  return { scraped: event.Records.length };
};

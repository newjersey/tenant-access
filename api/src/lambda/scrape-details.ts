import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { SQSEvent, SQSRecord } from "aws-lambda";
import { detailUrl, type ListingDetails, parseListingDetail } from "../scraper/detail-parser.js";
import { USER_AGENT } from "../scraper/source.js";
import { storePhotos } from "./photo-store.js";
import type { ScrapedDetails } from "./write-details.js";

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

interface Targets {
  dataBucket: string;
  imagesBucket: string;
  prefix: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function uidFrom(record: SQSRecord): number {
  const { uid } = JSON.parse(record.body) as { uid?: unknown };
  if (!Number.isInteger(uid)) {
    throw new Error(`Expected {"uid": <integer>} in ${record.messageId}, got ${record.body}`);
  }
  return uid as number;
}

function chain(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  while (current instanceof Error) {
    const code = (current as { code?: string }).code;
    parts.push(`${current.name}${code ? `(${code})` : ""}: ${current.message}`);
    current = current.cause;
  }
  return parts.length > 0 ? parts.join(" <- ") : String(error);
}

async function requestPage(url: string): Promise<Response> {
  try {
    return await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });
  } catch (error) {
    throw new Error(`Detail fetch failed for ${url}: ${chain(error)}`, { cause: error });
  }
}

async function fetchDetailPage(uid: number): Promise<string> {
  const url = detailUrl(uid);
  const response = await requestPage(url);

  if (!response.ok) {
    throw new Error(`Detail fetch failed: ${response.status} ${response.statusText} for ${url}`);
  }

  return response.text();
}

function audit(details: ListingDetails): void {
  const unknown = Object.keys(details.sections).filter((name) => !KNOWN_SECTIONS.has(name));
  if (unknown.length > 0) {
    console.warn(`uid ${details.uid}: unrecognized section(s): ${unknown.join(", ")}`);
  }
  if (details.availability === null) {
    console.warn(`uid ${details.uid}: no availability found`);
  }
}

async function scrapeOne(targets: Targets, uid: number) {
  const details = parseListingDetail(await fetchDetailPage(uid), uid);
  audit(details);

  const photoKeys = await storePhotos(s3, targets.imagesBucket, uid, details.photoUrls);
  const payload: ScrapedDetails = { details, photoKeys };
  const key = `${targets.prefix}${uid}.json`;

  await s3.send(
    new PutObjectCommand({
      Bucket: targets.dataBucket,
      Key: key,
      Body: JSON.stringify(payload),
      ContentType: "application/json",
    }),
  );

  console.log(`uid ${uid}: wrote ${key} with ${photoKeys.length} photo key(s)`);
}

export const handler = async (event: SQSEvent) => {
  const targets: Targets = {
    dataBucket: required("BUCKET_NAME"),
    imagesBucket: required("IMAGES_BUCKET_NAME"),
    prefix: process.env.DETAILS_PREFIX ?? "details/",
  };

  for (const record of event.Records) {
    await scrapeOne(targets, uidFrom(record));
  }

  return { scraped: event.Records.length };
};

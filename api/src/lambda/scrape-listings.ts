import { Readable } from "node:stream";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { encodeOnlyRecent, readOnlyRecent } from "../scraper/recency.js";
import { SEARCH_URL } from "../scraper/source.js";

const s3 = new S3Client();

// The search page is slow to assemble ~14MB; give it room but don't hang
// until the Lambda timeout kills us with no log line explaining why.
const FETCH_TIMEOUT_MS = 4 * 60 * 1000;

// A response far below this means we got an error page or a partial body,
// not a listings page. Recorded as a failure so the S3 event never fires.
const MIN_HTML_BYTES = 1_000_000;

/** YYYY-MM-DD is the en-CA format. Eastern time, matching the schedule's timezone. */
function easternDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export interface ScrapeEvent {
  onlyRecent?: boolean;
}

export const handler = async (event: ScrapeEvent = {}) => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) throw new Error("BUCKET_NAME is not set");

  const onlyRecent = readOnlyRecent(event.onlyRecent);
  const key = `${process.env.RAW_PREFIX ?? "raw/"}${easternDate(new Date())}/listings.html`;

  console.log(`Fetching ${SEARCH_URL} (onlyRecent=${onlyRecent})`);
  const response = await fetch(SEARCH_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      // Identify ourselves rather than looking like an anonymous scraper.
      "User-Agent": "NJ-TenantAccess/1.0 (+https://nj.gov)",
      Accept: "text/html",
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }

  // HeadObject would be another call; the upload's own byte count is enough.
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  console.log(`Uploaded s3://${bucket}/${key} (content-length ${contentLength})`);

  if (contentLength > 0 && contentLength < MIN_HTML_BYTES) {
    throw new Error(`Response only ${contentLength} bytes; expected >= ${MIN_HTML_BYTES}`);
  }

  // Streamed straight to S3 so the 14MB body is never fully buffered in memory.
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: Readable.fromWeb(response.body),
      ContentType: "text/html",
      Metadata: encodeOnlyRecent(onlyRecent),
    },
  });

  await upload.done();

  return { bucket, key, onlyRecent };
};

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import type { Listing } from "../scraper/parser.js";
import { getClient } from "./db.js";

const s3 = new S3Client();

const BATCH_SIZE = 500;

// Guards against hiding the whole catalog when a scrape or parse degrades:
// the site could change markup, rate-limit us, or return a partial page.
const MIN_ABSOLUTE_LISTINGS = 1000;
const MIN_FRACTION_OF_PREVIOUS = 0.8;

const COLUMNS = [
  "uid",
  "last_updated",
  "name",
  "address",
  "city",
  "state",
  "zip_code",
  "rent",
  "rent_max",
  "bedrooms",
  "bathrooms",
  "unit_type",
  "image_id",
  "image_url",
  "phone_number",
  "website",
  "contact_name",
  "contact_organization",
  "description",
  "is_waitlist_open",
  "amenities",
  "full_listing_url",
  "rent_type",
  "deposit_range",
];

function toValues(listing: Listing): unknown[] {
  return [
    listing.uid,
    listing.lastUpdated,
    listing.name,
    listing.address,
    listing.city,
    listing.state,
    listing.zipCode,
    listing.rent,
    listing.rentMax,
    listing.bedrooms,
    listing.bathrooms,
    listing.unitType,
    listing.imageId,
    listing.imageUrl,
    listing.phoneNumber,
    listing.website,
    listing.contactName,
    listing.contactOrganization,
    listing.description,
    listing.isWaitlistOpen,
    listing.amenities,
    listing.fullListingUrl,
    listing.rentType,
    listing.depositRange,
  ];
}

// On conflict, refresh every column except the PK and created_at, and bump scraped_at.
const UPDATE_SET = COLUMNS.filter((c) => c !== "uid")
  .map((c) => `${c} = EXCLUDED.${c}`)
  .concat("scraped_at = NOW()")
  .join(", ");

/** One multi-row INSERT ... ON CONFLICT for a batch of listings. */
function buildBatchInsert(batch: Listing[]): { sql: string; values: unknown[] } {
  const values: unknown[] = [];
  const rows = batch.map((listing, rowIndex) => {
    const rowValues = toValues(listing);
    values.push(...rowValues);
    const offset = rowIndex * COLUMNS.length;
    return `(${rowValues.map((_, i) => `$${offset + i + 1}`).join(", ")})`;
  });

  return {
    sql: `INSERT INTO listings (${COLUMNS.join(", ")}) VALUES ${rows.join(", ")}
      ON CONFLICT (uid) DO UPDATE SET ${UPDATE_SET}`,
    values,
  };
}

/**
 * Postgres rejects an ON CONFLICT DO UPDATE that touches the same row twice in
 * one statement, so a uid repeated inside a batch would fail the whole insert.
 * Last occurrence wins.
 */
function dedupeByUid(listings: Listing[]): Listing[] {
  return [...new Map(listings.map((listing) => [listing.uid, listing])).values()];
}

export const handler = async (event: S3Event) => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) throw new Error("BUCKET_NAME is not set");

  const record = event.Records[0];
  if (!record) {
    return { statusCode: 200, body: JSON.stringify({ success: true, message: "No records" }) };
  }

  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
  console.log(`Reading s3://${bucket}/${key}`);

  const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!object.Body) throw new Error(`Empty body for ${key}`);

  const listings = dedupeByUid(JSON.parse(await object.Body.transformToString()) as Listing[]);
  const uids = listings.map((listing) => listing.uid);
  console.log(`Loaded ${listings.length} unique listing(s)`);

  let client: Awaited<ReturnType<typeof getClient>> | undefined;

  try {
    client = await getClient();

    // Sanity-check against what we are already serving before touching anything.
    const previous = await client.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM listings WHERE shown_to_public",
    );
    const previousCount = Number(previous.rows[0].count);
    const floor = Math.max(
      MIN_ABSOLUTE_LISTINGS,
      Math.floor(previousCount * MIN_FRACTION_OF_PREVIOUS),
    );

    if (previousCount > 0 && listings.length < floor) {
      // Leave the table untouched: yesterday's listings are better than none.
      console.error(
        `Refusing to apply ${listings.length} listing(s); floor is ${floor} ` +
          `(previously showing ${previousCount})`,
      );
      throw new Error(`Listing count ${listings.length} below safety floor ${floor}`);
    }

    await client.query("BEGIN");

    for (let i = 0; i < listings.length; i += BATCH_SIZE) {
      const batch = listings.slice(i, i + BATCH_SIZE);
      const { sql, values } = buildBatchInsert(batch);
      await client.query(sql, values);
      console.log(`Upserted ${i + batch.length}/${listings.length}`);
    }

    // Reconcile visibility from the authoritative uid list. Idempotent, and
    // independent of clock skew or of which rows this run happened to touch.
    const hidden = await client.query(
      "UPDATE listings SET shown_to_public = false WHERE uid <> ALL($1::int[]) AND shown_to_public",
      [uids],
    );
    const shown = await client.query(
      "UPDATE listings SET shown_to_public = true WHERE uid = ANY($1::int[]) AND NOT shown_to_public",
      [uids],
    );

    await client.query("COMMIT");

    console.log(`Upserted ${listings.length}, hid ${hidden.rowCount}, restored ${shown.rowCount}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        upserted: listings.length,
        hidden: hidden.rowCount,
        restored: shown.rowCount,
      }),
    };
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => {});
    console.error("Update failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error && error.message,
      }),
    };
  } finally {
    await client?.end();
  }
};

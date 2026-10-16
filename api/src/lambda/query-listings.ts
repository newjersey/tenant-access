import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getClient } from "./db.js";
import { LISTING_SELECT_COLUMNS, type ListingRow } from "./listing-columns.js";

const s3 = new S3Client();

const SELECT_SQL = `
  SELECT
     ${LISTING_SELECT_COLUMNS},
     shown_to_public AS "shownToPublic",
     geocoded_at     AS "geocodedAt",
     geocode_match   AS "geocodeMatch"
  FROM listings
  ORDER BY uid
`;

export const handler = async () => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) throw new Error("BUCKET_NAME is not set");

  const client = await getClient();

  try {
    const result = await client.query<ListingRow>(SELECT_SQL);
    console.log(`Queried ${result.rowCount} listing(s)`);

    // the full catalog is over Lambda's 6MB response limit, so hand back an S3 key instead
    const key = `query-results/${new Date().toISOString()}.json`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(result.rows),
        ContentType: "application/json",
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        count: result.rowCount,
        location: `s3://${bucket}/${key}`,
      }),
    };
  } catch (error) {
    console.error("Query failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error && error.message,
      }),
    };
  } finally {
    await client.end();
  }
};

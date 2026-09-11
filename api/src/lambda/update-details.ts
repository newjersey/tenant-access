import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import { getClient } from "./db.js";
import { type ScrapedDetails, writeListingDetails } from "./write-details.js";

const s3 = new S3Client();

export const handler = async (event: S3Event) => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) throw new Error("BUCKET_NAME is not set");

  if (event.Records.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ success: true, message: "No records" }) };
  }

  const client = await getClient();

  try {
    for (const record of event.Records) {
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
      const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!object.Body) throw new Error(`Empty body for ${key}`);

      const { details, photoKeys } = JSON.parse(
        await object.Body.transformToString(),
      ) as ScrapedDetails;
      await writeListingDetails(client, details, photoKeys);

      console.log(`Wrote details for uid ${details.uid} from ${key}`);
    }
  } finally {
    await client.end();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, written: event.Records.length }),
  };
};

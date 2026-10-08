import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import { getClient } from "./db.js";
import { parseGeocodes, writeGeocodes } from "./write-geocodes.js";

const s3 = new S3Client();

export const handler = async (event: S3Event) => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) throw new Error("BUCKET_NAME is not set");

  if (event.Records.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ success: true, message: "No records" }) };
  }

  const client = await getClient();
  let written = 0;

  try {
    for (const record of event.Records) {
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
      const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!object.Body) throw new Error(`Empty body for ${key}`);

      const geocodes = parseGeocodes(await object.Body.transformToString(), key);
      const updated = await writeGeocodes(client, geocodes);
      written += updated;

      // a listing can be removed between geocoding and writing, so skip rather than fail
      if (updated < geocodes.length) {
        console.warn(`${key}: ${geocodes.length - updated} uid(s) had no listings row`);
      }
      console.log(`Wrote ${updated} geocode(s) from ${key}`);
    }
  } finally {
    await client.end();
  }

  return { statusCode: 200, body: JSON.stringify({ success: true, written }) };
};

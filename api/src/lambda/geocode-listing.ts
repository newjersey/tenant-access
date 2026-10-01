import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type GeocodeAddress, geocodeAddresses } from "../geocoder/census.js";

const s3 = new S3Client();

export const handler = async (event: GeocodeAddress) => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) throw new Error("BUCKET_NAME is not set");
  const prefix = process.env.GEOCODE_PREFIX ?? "geocode/";

  if (!Number.isInteger(event.uid) || typeof event.address !== "string") {
    throw new Error(`Expected a listing with uid and address, got ${JSON.stringify(event)}`);
  }

  const geocodes = await geocodeAddresses([event]);
  const key = `${prefix}${event.uid}.json`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(geocodes),
      ContentType: "application/json",
    }),
  );

  console.log(`uid ${event.uid}: ${geocodes[0].match}, wrote ${key}`);
  return geocodes[0];
};

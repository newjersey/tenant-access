import type { Client } from "pg";
import type { LegacyDetails, ListingDetails } from "../scraper/detail-parser.js";

export interface ScrapedDetails {
  details: ListingDetails;
  photoKeys: string[];
}

const SQL = `UPDATE listings
  SET legacy_details = $2::jsonb,
    photo_keys = $3::text[],
    details_scraped_at = NOW()
  WHERE uid = $1`;

function toLegacyDetails(details: ListingDetails): string {
  const { uid: _uid, photoUrls: _photoUrls, ...legacy } = details;
  return JSON.stringify(legacy satisfies LegacyDetails);
}

export async function writeListingDetails(
  client: Client,
  details: ListingDetails,
  photoKeys: string[],
): Promise<void> {
  const result = await client.query(SQL, [details.uid, toLegacyDetails(details), photoKeys]);

  if (result.rowCount === 0) {
    throw new Error(`No listings row for uid ${details.uid}; details were not written`);
  }
}

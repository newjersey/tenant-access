import type { Listing } from "../scraper/parser.js";
import { getClient } from "./db.js";

interface Event {
  listings: Listing[];
}

const COLUMNS = [
  "uid",
  "last_updated",
  "name",
  "address",
  "city",
  "state",
  "zip_code",
  "rent",
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

const placeholders = COLUMNS.map((_, i) => `$${i + 1}`).join(", ");

const INSERT_SQL = `INSERT INTO listings (${COLUMNS.join(", ")}) VALUES (${placeholders})
  ON CONFLICT (uid) DO UPDATE SET ${UPDATE_SET}`;

export const handler = async (event: Event) => {
  const listings = event.listings ?? [];
  console.log(`Inserting ${listings.length} listing(s)`);

  if (listings.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, inserted: 0, message: "No listings provided" }),
    };
  }

  let client: Awaited<ReturnType<typeof getClient>> | undefined;

  try {
    client = await getClient();
    await client.query("BEGIN");
    for (const listing of listings) {
      await client.query(INSERT_SQL, toValues(listing));
    }
    await client.query("COMMIT");
    console.log(`Upserted ${listings.length} listing(s)`);
    return { statusCode: 200, body: JSON.stringify({ success: true, inserted: listings.length }) };
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => {});
    console.error("Insert failed:", error);
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

import type { Listing } from "../scraper/parser.js";
import { getClient } from "./db.js";

// Maps snake_case DB columns back to the camelCase Listing shape.
const SELECT_SQL = `
  SELECT
    uid,
    last_updated       AS "lastUpdated",
    name,
    address,
    city,
    state,
    zip_code           AS "zipCode",
    rent,
    bedrooms,
    bathrooms,
    unit_type          AS "unitType",
    image_id           AS "imageId",
    image_url          AS "imageUrl",
    phone_number       AS "phoneNumber",
    website,
    description,
    is_waitlist_open   AS "isWaitlistOpen",
    amenities,
    contact_name       AS "contactName",
    contact_organization AS "contactOrganization",
    full_listing_url   AS "fullListingUrl",
    rent_type          AS "rentType",
    deposit_range      AS "depositRange"
  FROM listings
  ORDER BY uid
`;

export const handler = async () => {
  const client = await getClient();

  try {
    const result = await client.query<Listing>(SELECT_SQL);
    console.log(`Queried ${result.rowCount} listing(s)`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        count: result.rowCount,
        listings: result.rows,
      }),
    };
  } catch (error) {
    console.error("Query failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  } finally {
    await client.end();
  }
};

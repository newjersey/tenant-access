import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getPool } from "./db.js";
import { headerValue, respond } from "./http-response.js";
import { LISTING_SELECT_COLUMNS, type ListingRow } from "./listing-columns.js";

const UID_PATTERN = /^\d{1,9}$/;

const SELECT_SQL = `
  SELECT
    ${LISTING_SELECT_COLUMNS}
  FROM listings
  WHERE uid = $1 AND shown_to_public
`;

const NOT_FOUND = { success: false, error: "Listing not found" };

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const origin = headerValue(event, "origin");
  const uid = event.pathParameters?.uid ?? "";
  if (!UID_PATTERN.test(uid)) return respond(404, NOT_FOUND, origin);

  try {
    const pool = await getPool();
    const result = await pool.query<ListingRow>(SELECT_SQL, [Number(uid)]);
    const listing = result.rows[0];
    if (!listing) return respond(404, NOT_FOUND, origin);

    return respond(200, { success: true, listing }, origin);
  } catch (error) {
    console.error("Get listing failed:", error);
    return respond(500, { success: false, error: "Unable to load listing" }, origin);
  }
};

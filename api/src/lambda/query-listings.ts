import type { Listing } from "../scraper/parser.js";
import { getClient } from "./db.js";
import { LISTING_SELECT_COLUMNS } from "./listing-columns.js";

const SELECT_SQL = `
  SELECT
     ${LISTING_SELECT_COLUMNS}
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
        error: error instanceof Error && error.message,
      }),
    };
  } finally {
    await client.end();
  }
};

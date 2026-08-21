import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { Pool } from "pg";
import type { Listing } from "../scraper/parser.js";
import { getPool } from "./db.js";
import { LISTING_SELECT_COLUMNS } from "./listing-columns.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MAX_PAGE = 100_000;

// For performance, stop counting past this many rows. The frontend shows "over 1000 results"
// and unbounded pagination rather than an exact figure.
const COUNT_CAP = 1001;

const WHERE_SQL = `
  WHERE shown_to_public
    AND ($1::text IS NULL OR LOWER(city) = LOWER($1))`;

const RESULTS_SQL = `
  SELECT
    ${LISTING_SELECT_COLUMNS}
  FROM listings${WHERE_SQL}
  ORDER BY uid
  LIMIT $2
  OFFSET $3
`;

const COUNT_SQL = `
  SELECT COUNT(*) AS total
  FROM (
    SELECT 1
    FROM listings${WHERE_SQL}
    LIMIT ${COUNT_CAP}
  )
`;

async function queryResults(pool: Pool, location: string | null, pageSize: number, offset: number) {
  const result = await pool.query<Listing>(RESULTS_SQL, [location, pageSize, offset]);
  return result.rows;
}

async function queryTotalResultsCount(pool: Pool, location: string | null) {
  const result = await pool.query<{ total: string }>(COUNT_SQL, [location]);
  return Number(result.rows[0].total);
}

const parseAndConstrainInt = (raw: string | undefined, fallback: number, min: number, max: number): number => {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isNaN(parsed) ? fallback : Math.min(Math.max(parsed, min), max);
};

const respond = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "*",
    "Cache-Control": statusCode === 200 ? "public, max-age=300" : "no-store",
  },
  body: JSON.stringify(body),
});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const params = event.queryStringParameters ?? {};
  const location = params.location?.trim() || null;
  const pageSize = parseAndConstrainInt(params.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
  const page = parseAndConstrainInt(params.page, 1, 1, MAX_PAGE);

  try {
    const pool = await getPool();
    const [listings, rawCount] = await Promise.all([
      queryResults(pool, location, pageSize, (page - 1) * pageSize),
      queryTotalResultsCount(pool, location),
    ]);

    return respond(200, {
      success: true,
      listings,
      pagination: {
        page,
        pageSize,
        total: rawCount,
      },
    });
  } catch (error) {
    console.error("Search failed:", error);
    return respond(500, { success: false, error: "Unable to search listings" });
  }
};

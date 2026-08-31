import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { Pool } from "pg";
import type { Listing } from "../scraper/parser.js";
import { getPool } from "./db.js";
import { LISTING_SELECT_COLUMNS } from "./listing-columns.js";
import { isFromCloudFront } from "./require-cloudfront.js";

const PAGE_SIZE = 20;
const CACHE_SECONDS = 300;
const MAX_PARAM_LENGTH = 100;

// For performance, stop counting or searching past this many.
// The frontend shows "over 1000 results" rather than an exact figure.
const RESULT_CAP = 1001;
const MAX_PAGE = 50; // 50 pages * 20 results per page = 1000

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const WHERE_SQL = `
  WHERE shown_to_public
    AND ($1::text IS NULL OR lower(city) = lower($1))
    AND ($2::text IS NULL OR lower(city) IN (
      SELECT lower(cc.city) FROM city_counties cc WHERE lower(cc.county) = lower($2)
    ))`;

const RESULTS_SQL = `
  SELECT
    ${LISTING_SELECT_COLUMNS}
  FROM listings${WHERE_SQL}
  ORDER BY last_updated DESC NULLS LAST, uid
  LIMIT $3
  OFFSET $4
`;

const COUNT_SQL = `
  SELECT COUNT(*) AS total
  FROM (
    SELECT 1
    FROM listings${WHERE_SQL}
    LIMIT ${RESULT_CAP}
  )
`;

interface Location {
  city: string | null;
  county: string | null;
}

// "Somerset County" -> { county: "Somerset" }; anything else -> { city: <as given> }.
function parseLocation(raw: string | undefined): Location {
  const trimmed = raw?.trim().slice(0, MAX_PARAM_LENGTH) || null;
  if (!trimmed) return { city: null, county: null };
  const county = trimmed.match(/^(.+?)\s+County$/i)?.[1];
  return county ? { city: null, county } : { city: trimmed, county: null };
}

async function queryResults(pool: Pool, location: Location, pageSize: number, offset: number) {
  const result = await pool.query<Listing>(RESULTS_SQL, [
    location.city,
    location.county,
    pageSize,
    offset
  ]);
  return result.rows;
}

async function queryTotalResultsCount(pool: Pool, location: Location) {
  const result = await pool.query<{ total: string }>(COUNT_SQL, [location.city, location.county]);
  return Number(result.rows[0].total);
}

const parseAndConstrainPage = (raw: string | undefined): number => {
  const minPage = 1;
  const fallback = 1;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isNaN(parsed) ? fallback : Math.min(Math.max(parsed, minPage), MAX_PAGE);
};

const respond = (
  statusCode: number,
  body: unknown,
  origin: string | undefined,
): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": statusCode === 200 ? `public, max-age=${CACHE_SECONDS}` : "no-store",
    Vary: "Origin",
    ...(origin && ALLOWED_ORIGINS.includes(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
  },
  body: JSON.stringify(body),
});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const origin = event.headers?.origin;
  if (!isFromCloudFront(event)) {
    return respond(403, { success: false, error: "Forbidden" }, origin);
  }
  const params = event.queryStringParameters ?? {};
  const location = parseLocation(params.location);
  const page = parseAndConstrainPage(params.page);

  try {
    const pool = await getPool();
    const [listings, rawCount] = await Promise.all([
      queryResults(pool, location, PAGE_SIZE, (page - 1) * PAGE_SIZE),
      queryTotalResultsCount(pool, location),
    ]);

    return respond(
      200,
      {
        success: true,
        listings,
        pagination: {
          page,
          pageSize: PAGE_SIZE,
          total: rawCount,
        },
      },
      origin,
    );
  } catch (error) {
    console.error("Search failed:", error);
    return respond(500, { success: false, error: "Unable to search listings" }, origin);
  }
};

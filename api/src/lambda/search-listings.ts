import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { Pool } from "pg";
import { getPool } from "./db.js";
import { LISTING_SELECT_COLUMNS, type ListingRow } from "./listing-columns.js";
import { buildFilterClause, type FilterClause } from "./search-filters.js";
import type { SearchParams } from "./search-params.js";

interface Location {
  city: string | null;
  county: string | null;
}

interface Search {
  location: Location;
  filters: FilterClause;
  sort: SortKey;
  page: number;
}

const PAGE_SIZE = 20;
const CACHE_SECONDS = 300;
const MAX_PARAM_LENGTH = 100;
export const RADIUS_MILES = 5;

const CITY_PLACEHOLDER = 1;
const COUNTY_PLACEHOLDER = 2;
const RADIUS_PLACEHOLDER = 3;
const FIRST_FILTER_PLACEHOLDER = 4;

// For performance, stop counting or searching past this many.
// The frontend shows "over 1000 results" rather than an exact figure.
const RESULT_CAP = 1001;
const MAX_PAGE = 50; // 50 pages * 20 results per page = 1000

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const SORT_ORDERS = {
  updated: "last_updated DESC NULLS LAST, uid",
  price_asc: "rent ASC NULLS LAST, uid",
  price_desc: "rent DESC NULLS LAST, uid",
} as const;
type SortKey = keyof typeof SORT_ORDERS;
const DEFAULT_SORT: SortKey = "updated";

function parseSort(raw: string | undefined): SortKey {
  return raw !== undefined && raw in SORT_ORDERS ? (raw as SortKey) : DEFAULT_SORT;
}

const centerSql = `
  LEFT JOIN (
    SELECT latitude AS center_latitude, longitude AS center_longitude
      FROM city_counties WHERE lower(city) = lower($${CITY_PLACEHOLDER})
    UNION ALL
    SELECT latitude, longitude
      FROM counties WHERE lower(name) = lower($${COUNTY_PLACEHOLDER})
  ) center ON TRUE`;

const whereSql = (filters: FilterClause) => `
  WHERE shown_to_public
    AND (
      ($${CITY_PLACEHOLDER}::text IS NULL AND $${COUNTY_PLACEHOLDER}::text IS NULL)
      OR lower(city) = lower($${CITY_PLACEHOLDER})
      OR lower(city) IN (
        SELECT lower(cc.city) FROM city_counties cc WHERE lower(cc.county) = lower($${COUNTY_PLACEHOLDER})
      )
      OR miles_between(latitude, longitude, center_latitude, center_longitude) <= $${RADIUS_PLACEHOLDER}
    )${filters.sql}`;

const resultsSql = (sort: SortKey, filters: FilterClause) => `
  SELECT
    ${LISTING_SELECT_COLUMNS}
  FROM listings${centerSql}${whereSql(filters)}
  ORDER BY ${SORT_ORDERS[sort]}
  LIMIT $${FIRST_FILTER_PLACEHOLDER + filters.values.length}
  OFFSET $${FIRST_FILTER_PLACEHOLDER + filters.values.length + 1}
`;

const countSql = (filters: FilterClause) => `
  SELECT COUNT(*) AS total
  FROM (
    SELECT 1
    FROM listings${centerSql}${whereSql(filters)}
    LIMIT ${RESULT_CAP}
  )
`;

// "Somerset County" -> { county: "Somerset" }; anything else -> { city: <as given> }.
function parseLocation(raw: string | undefined): Location {
  const trimmed = raw?.trim().slice(0, MAX_PARAM_LENGTH) || null;
  if (!trimmed) return { city: null, county: null };
  const county = trimmed.match(/^(.+?)\s+County$/i)?.[1];
  return county ? { city: null, county } : { city: trimmed, county: null };
}

async function queryResults(pool: Pool, search: Search) {
  const result = await pool.query<ListingRow>(resultsSql(search.sort, search.filters), [
    search.location.city,
    search.location.county,
    RADIUS_MILES,
    ...search.filters.values,
    PAGE_SIZE,
    (search.page - 1) * PAGE_SIZE,
  ]);
  return result.rows;
}

async function queryTotalResultsCount(pool: Pool, search: Search) {
  const result = await pool.query<{ total: string }>(countSql(search.filters), [
    search.location.city,
    search.location.county,
    RADIUS_MILES,
    ...search.filters.values,
  ]);
  return Number(result.rows[0].total);
}

const parseAndConstrainPage = (raw: string | undefined): number => {
  const minPage = 1;
  const fallback = 1;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isNaN(parsed) ? fallback : Math.min(Math.max(parsed, minPage), MAX_PAGE);
};

// REST API (v1) forwards header names with the casing the client used
const headerValue = (event: APIGatewayProxyEvent, name: string): string | undefined => {
  const headers = event.headers ?? {};
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name);
  return key ? (headers[key] ?? undefined) : undefined;
};

const respond = (
  statusCode: number,
  body: unknown,
  origin: string | undefined,
): APIGatewayProxyResult => ({
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

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const origin = headerValue(event, "origin");
  const params: SearchParams = event.queryStringParameters ?? {};
  const search: Search = {
    location: parseLocation(params.location),
    filters: buildFilterClause(params, FIRST_FILTER_PLACEHOLDER),
    sort: parseSort(params.sort),
    page: parseAndConstrainPage(params.page),
  };

  try {
    const pool = await getPool();
    const [listings, rawCount] = await Promise.all([
      queryResults(pool, search),
      queryTotalResultsCount(pool, search),
    ]);

    return respond(
      200,
      {
        success: true,
        listings,
        pagination: {
          page: search.page,
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

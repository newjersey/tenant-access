import { FILTER_QUERY_PARAMS, type FilterQueryParam, type SearchParams } from "./search-params.js";

const MAX_PARAM = 10;

const SENIOR_AMENITY = "Seniors Housing";

type Condition = { sql: (placeholder: string) => string; value: unknown };
type FilterDef = (raw: string) => Condition | null;

const roomCount = (raw: string): { count: number; orMore: boolean } | null => {
  const match = /^(\d+)(\+?)$/.exec(raw);
  if (!match) return null;

  const count = Number.parseInt(match[1], 10);
  return count >= 1 && count <= MAX_PARAM ? { count, orMore: match[2] === "+" } : null;
};

const FILTERS: Record<FilterQueryParam, FilterDef> = {
  bedrooms: (raw) => {
    if (raw === "studio") {
      return { sql: (placeholder) => `bedrooms = ${placeholder}`, value: 0 };
    }

    const parsed = roomCount(raw);
    return parsed
      ? {
          sql: (placeholder) => `bedrooms ${parsed.orMore ? ">=" : "="} ${placeholder}`,
          value: parsed.count,
        }
      : null;
  },
  bathrooms: (raw) => {
    const parsed = roomCount(raw);
    return parsed
      ? { sql: (placeholder) => `bathrooms >= ${placeholder}`, value: parsed.count }
      : null;
  },
  senior: (raw) =>
    raw === "true"
      ? {
          sql: (placeholder) => `amenities @> ARRAY[${placeholder}]::text[]`,
          value: SENIOR_AMENITY,
        }
      : null,
};

export interface FilterClause {
  sql: string;
  values: unknown[];
}

export function buildFilterClause(params: SearchParams, firstPlaceholder: number): FilterClause {
  const values: unknown[] = [];
  const conditions: string[] = [];

  for (const name of FILTER_QUERY_PARAMS) {
    const raw = params[name]?.trim();
    if (!raw || raw === "any") continue;

    const condition = FILTERS[name](raw);
    if (!condition) continue;

    values.push(condition.value);
    conditions.push(condition.sql(`$${firstPlaceholder + values.length - 1}`));
  }

  return {
    sql: conditions.map((condition) => `\n    AND ${condition}`).join(""),
    values,
  };
}

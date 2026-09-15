import { FILTER_QUERY_PARAMS, type FilterQueryParam, type SearchParams } from "./search-params.js";

const MAX_PARAM = 10;

type Condition = { sql: (placeholder: string) => string; value: unknown };
type FilterDef = (raw: string) => Condition | null;

const atLeast = (raw: string, sql: (placeholder: string) => string): Condition | null => {
  const parsed = Number.parseInt(raw, 10);
  const inRange = Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_PARAM;
  return inRange ? { sql, value: parsed } : null;
};

const FILTERS: Record<FilterQueryParam, FilterDef> = {
  bedrooms: (raw) =>
    raw === "studio"
      ? { sql: (placeholder) => `bedrooms = ${placeholder}`, value: 0 }
      : atLeast(raw, (placeholder) => `bedrooms >= ${placeholder}`),
  bathrooms: (raw) => atLeast(raw, (placeholder) => `bathrooms >= ${placeholder}`),
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

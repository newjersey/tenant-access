export const SORT_OPTIONS = ["updated", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
const DEFAULT_SORT: SortOption = "updated";

export const FILTER_KEYS = ["bedrooms", "bathrooms", "senior", "maxRent"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type SearchFilters = Partial<Record<FilterKey, string>>;
export const TOGGLE_FILTER_KEYS: readonly FilterKey[] = ["senior"];
export const DOLLAR_AMOUNT_FILTER_KEYS: readonly FilterKey[] = ["maxRent"];

export const DOLLAR_AMOUNT_DIGITS = 6;
export const DOLLAR_AMOUNT_PATTERN = /^[1-9]\d{0,5}$/; // One to six digits, no leading zero

export const wholeDollars = (raw: string): string =>
  raw.split(".")[0].replace(/\D/g, "").replace(/^0+/, "").slice(0, DOLLAR_AMOUNT_DIGITS);

export interface SearchQuery {
  location: string | null;
  page: number;
  sort?: SortOption;
  filters?: SearchFilters;
}

export function parseSort(raw: string | null): SortOption {
  return SORT_OPTIONS.find((option) => option === raw) ?? DEFAULT_SORT;
}

export function parseFilters(params: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};

  for (const key of FILTER_KEYS) {
    const value = params.get(key)?.trim();
    if (!value || value === "any") continue;
    if (TOGGLE_FILTER_KEYS.includes(key) && value !== "true") continue;
    if (DOLLAR_AMOUNT_FILTER_KEYS.includes(key) && !DOLLAR_AMOUNT_PATTERN.test(value)) continue;

    filters[key] = value;
  }

  return filters;
}

export function withFilter(
  current: URLSearchParams,
  name: FilterKey,
  value: string,
): URLSearchParams {
  const params = new URLSearchParams(current);
  if (value) {
    params.set(name, value);
  } else {
    params.delete(name);
  }
  params.delete("page");
  return params;
}

export function parseSearchQuery(params: URLSearchParams): SearchQuery {
  const parsedPage = Number.parseInt(params.get("page") ?? "", 10);

  return {
    location: params.get("location")?.trim() || null,
    page: Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1),
    sort: parseSort(params.get("sort")),
    filters: parseFilters(params),
  };
}

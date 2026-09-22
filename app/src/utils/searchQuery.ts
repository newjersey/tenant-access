export const SORT_OPTIONS = ["updated", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
const DEFAULT_SORT: SortOption = "updated";

export const FILTER_KEYS = ["bedrooms", "bathrooms", "senior"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type SearchFilters = Partial<Record<FilterKey, string>>;
export const TOGGLE_FILTER_KEYS: readonly FilterKey[] = ["senior"];

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

    filters[key] = value;
  }

  return filters;
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

export const SORT_OPTIONS = ["updated", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
const DEFAULT_SORT: SortOption = "updated";

export interface SearchQuery {
  location: string | null;
  page: number;
  sort?: SortOption;
}

export function parseSort(raw: string | null): SortOption {
  return SORT_OPTIONS.find((option) => option === raw) ?? DEFAULT_SORT;
}

export function parseSearchQuery(params: URLSearchParams): SearchQuery {
  const parsedPage = Number.parseInt(params.get("page") ?? "", 10);

  return {
    location: params.get("location")?.trim() || null,
    page: Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1),
    sort: parseSort(params.get("sort")),
  };
}

export const FILTER_QUERY_PARAMS = ["bedrooms", "bathrooms"] as const;

export const SEARCH_QUERY_PARAMS = ["location", "page", "sort", ...FILTER_QUERY_PARAMS] as const;

export type FilterQueryParam = (typeof FILTER_QUERY_PARAMS)[number];
export type SearchParams = Partial<Record<(typeof SEARCH_QUERY_PARAMS)[number], string>>;

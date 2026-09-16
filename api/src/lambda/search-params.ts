export const SEARCH_QUERY_PARAMS = ["location", "page", "sort"] as const;

export type SearchParams = Partial<Record<(typeof SEARCH_QUERY_PARAMS)[number], string>>;

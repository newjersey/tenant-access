export interface SearchQuery {
  location: string | null;
  page: number;
}

export function parseSearchQuery(params: URLSearchParams): SearchQuery {
  const parsedPage = Number.parseInt(params.get("page") ?? "", 10);

  return {
    location: params.get("location")?.trim() || null,
    page: Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1),
  };
}

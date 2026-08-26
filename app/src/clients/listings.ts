import type { SearchQuery } from "@/utils/searchQuery";

/**
 * A public listing as returned by the search API. Mirrors the `Listing` interface in
 * `api/src/scraper/parser.ts` and the aliases in `api/src/lambda/listing-columns.ts` — keep the
 * three in step when a column is added.
 */
export interface Listing {
  uid: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  rent: number | null;
  rentMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  unitType: string | null;
  imageId: number | null;
  imageUrl: string | null;
  phoneNumber: string | null;
  website: string | null;
  description: string | null;
  lastUpdated: string | null;
  isWaitlistOpen: boolean;
  amenities: string[];
  contactName: string | null;
  contactOrganization: string | null;
  fullListingUrl: string | null;
  rentType: string | null;
  depositRange: string | null;
}

export interface SearchListingsResponse {
  success: true;
  listings: Listing[];
  pagination: {
    /** The page the API actually served, which may be clamped below the one requested. */
    page: number;
    pageSize: number;
    /** Capped at 1001 by the API; treat that value as "over 1000". */
    total: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Ask the search API for one page of listings. Rejects on a network error or non-2xx status. */
export async function searchListings(
  query: SearchQuery,
  signal?: AbortSignal,
): Promise<SearchListingsResponse> {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not set");
  }

  const params = [`page=${query.page}`];
  if (query.location) {
    params.push(`location=${encodeURIComponent(query.location)}`);
  }

  const response = await fetch(`${API_BASE_URL}/listings/search?${params.join("&")}`, { signal });
  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }

  return response.json();
}

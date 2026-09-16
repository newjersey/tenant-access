import type { SearchQuery } from "@/utils/searchQuery";

export type DetailValue = string | string[];
export type DetailSections = Record<string, Record<string, DetailValue>>;

export interface LegacyDetails {
  email: string | null;
  availability: string | null;
  leaseLength: string | null;
  utilitiesIncluded: string[];
  applicationFee: string | null;
  yearBuilt: number | null;
  sections: DetailSections;
}

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
  photoKeys: string[];
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
  legacyDetails: LegacyDetails | null;
}

export interface SearchListingsResponse {
  success: true;
  listings: Listing[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  if (query.sort) {
    params.push(`sort=${encodeURIComponent(query.sort)}`);
  }
  for (const [key, value] of Object.entries(query.filters ?? {})) {
    params.push(`${key}=${encodeURIComponent(value)}`);
  }

  const response = await fetch(`${API_BASE_URL}/listings/search?${params.join("&")}`, { signal });
  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }

  return response.json();
}

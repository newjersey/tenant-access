import { useEffect, useState } from "react";
import { type Listing, searchListings, type SearchListingsResponse } from "@/clients/listings";
import type { SearchQuery } from "@/utils/searchQuery";

interface SearchListingsState {
  listings: Listing[];
  pagination: SearchListingsResponse["pagination"] | null;
  isLoading: boolean;
  hasError: boolean;
}

const PENDING: SearchListingsState = {
  listings: [],
  pagination: null,
  isLoading: true,
  hasError: false,
};

/**
 * Fetch one page of listings, re-fetching whenever the location or page changes. The in-flight
 * request is aborted when the query changes, so a slow earlier response cannot overwrite a newer
 * one.
 */
export function useSearchListings({ location, page }: SearchQuery): SearchListingsState {
  const [state, setState] = useState<SearchListingsState>(PENDING);

  useEffect(() => {
    const controller = new AbortController();
    setState(PENDING);

    searchListings({ location, page }, controller.signal)
      .then((response) => {
        setState({
          listings: response.listings,
          pagination: response.pagination,
          isLoading: false,
          hasError: false,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Listing search failed:", error);
        setState({ listings: [], pagination: null, isLoading: false, hasError: true });
      });

    return () => controller.abort();
  }, [location, page]);

  return state;
}

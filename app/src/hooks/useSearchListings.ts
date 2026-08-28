import { useEffect, useState } from "react";
import { type Listing, type SearchListingsResponse, searchListings } from "@/clients/listings";
import type { SearchQuery } from "@/utils/searchQuery";

type Pagination = SearchListingsResponse["pagination"];

export type SearchListingsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; listings: Listing[]; pagination: Pagination };

const LOADING: SearchListingsState = { status: "loading" };
const ERROR: SearchListingsState = { status: "error" };

export function useSearchListings({ location, page }: SearchQuery): SearchListingsState {
  const [state, setState] = useState<SearchListingsState>(LOADING);

  useEffect(() => {
    const controller = new AbortController();
    setState(LOADING);

    searchListings({ location, page }, controller.signal)
      .then((response) => {
        setState({
          status: "ready",
          listings: response.listings,
          pagination: response.pagination,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState(ERROR);
        }
      });

    return () => controller.abort();
  }, [location, page]);

  return state;
}

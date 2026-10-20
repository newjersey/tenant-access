import { useEffect, useState } from "react";
import { getListing, type Listing } from "@/clients/listings";

export type ListingState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not_found" }
  | { status: "ready"; listing: Listing };

const LOADING: ListingState = { status: "loading" };
const ERROR: ListingState = { status: "error" };
const NOT_FOUND: ListingState = { status: "not_found" };

export function useListing(uid: string): ListingState {
  const [state, setState] = useState<ListingState>(LOADING);

  useEffect(() => {
    const controller = new AbortController();
    setState(LOADING);

    getListing(uid, controller.signal)
      .then((listing) => {
        setState(listing ? { status: "ready", listing } : NOT_FOUND);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState(ERROR);
        }
      });

    return () => controller.abort();
  }, [uid]);

  return state;
}

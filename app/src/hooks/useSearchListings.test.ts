import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchListingsResponse } from "@/clients/listings";
import type { SearchQuery } from "@/utils/searchQuery";
import { useSearchListings } from "./useSearchListings";

const { searchListingsMock } = vi.hoisted(() => ({ searchListingsMock: vi.fn() }));
vi.mock("@/clients/listings", () => ({ searchListings: searchListingsMock }));

const response: SearchListingsResponse = {
  success: true,
  listings: [],
  pagination: { page: 1, pageSize: 20, total: 0 },
};

describe("useSearchListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports the listings once the request resolves", async () => {
    searchListingsMock.mockResolvedValue(response);

    const { result } = renderHook(() => useSearchListings({ location: "Newark", page: 1 }));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("reports an error when a live request rejects", async () => {
    searchListingsMock.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useSearchListings({ location: "Newark", page: 1 }));

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("ignores a rejection from a request that was already aborted", async () => {
    let rejectStale: (reason?: unknown) => void = () => {};
    const staleRequest = new Promise<SearchListingsResponse>((_, reject) => {
      rejectStale = reject;
    });

    const pendingRequest = new Promise<SearchListingsResponse>(() => {});
    searchListingsMock.mockReturnValueOnce(staleRequest).mockReturnValueOnce(pendingRequest);

    const { result, rerender } = renderHook((props: SearchQuery) => useSearchListings(props), {
      initialProps: { location: "Newark", page: 1 },
    });

    // Changing the query aborts the first request's controller
    rerender({ location: "Trenton", page: 1 });

    // The stale request now rejects, but its signal is aborted, so state should NOT flip to error
    rejectStale(new DOMException("Aborted", "AbortError"));
    await staleRequest.catch(() => {});

    expect(result.current.status).toBe("loading");
  });
});

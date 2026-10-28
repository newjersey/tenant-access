import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing } from "@/clients/listings";
import { makeListing } from "@/test/makeListing";
import { useListing } from "./useListing";

const { getListingMock } = vi.hoisted(() => ({ getListingMock: vi.fn() }));
vi.mock("@/clients/listings", () => ({ getListing: getListingMock }));

describe("useListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports the listing once the request resolves", async () => {
    const listing = makeListing({ uid: 7 });
    getListingMock.mockResolvedValue(listing);

    const { result } = renderHook(() => useListing("7"));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current).toEqual({ status: "ready", listing }));
    expect(getListingMock).toHaveBeenCalledWith("7", expect.any(AbortSignal));
  });

  it("reports not_found when the API has no public listing", async () => {
    getListingMock.mockResolvedValue(null);

    const { result } = renderHook(() => useListing("7"));

    await waitFor(() => expect(result.current.status).toBe("not_found"));
  });

  it("reports an error when a live request rejects", async () => {
    getListingMock.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useListing("7"));

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("ignores a rejection from a request that was already aborted", async () => {
    let rejectStale: (reason?: unknown) => void = () => {};
    const staleRequest = new Promise<Listing | null>((_, reject) => {
      rejectStale = reject;
    });
    getListingMock
      .mockReturnValueOnce(staleRequest)
      .mockReturnValueOnce(new Promise<Listing | null>(() => {}));

    const { result, rerender } = renderHook((uid: string) => useListing(uid), {
      initialProps: "7",
    });

    // a new uid aborts the first request's controller
    rerender("8");
    rejectStale(new DOMException("Aborted", "AbortError"));
    await staleRequest.catch(() => {});

    expect(result.current.status).toBe("loading");
  });
});

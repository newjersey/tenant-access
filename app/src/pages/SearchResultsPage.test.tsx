import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import common from "@/data/content/en/common.json";
import content from "@/data/content/en/search-results.json";
import { makeListing } from "@/test/makeListing";
import SearchResultsPage from "./SearchResultsPage";

const { searchListingsMock } = vi.hoisted(() => ({ searchListingsMock: vi.fn() }));

vi.mock("@/clients/listings", () => ({ searchListings: searchListingsMock }));
vi.mock("@/data/locations/cities-by-county.json", () => import("@/test/citiesByCounty"));

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SearchResultsPage />
    </MemoryRouter>,
  );

describe("SearchResultsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchListingsMock.mockResolvedValue({
      success: true,
      listings: [],
      pagination: { page: 1, total: 0 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks the API for the location, page, and filters in the URL", async () => {
    renderAt("/search?location=Newark&page=3&bedrooms=studio&bathrooms=2");

    expect(await screen.findByText(content.no_results)).toBeInTheDocument();
    expect(await screen.findByText(content.filters_applied)).toBeInTheDocument();
    expect(searchListingsMock).toHaveBeenCalledWith(
      {
        location: "Newark",
        page: 3,
        sort: "updated",
        filters: { bedrooms: "studio", bathrooms: "2" },
      },
      expect.any(AbortSignal),
    );
  });

  it("closes the filter drawer when button clicked or the window grows to desktop width", async () => {
    renderAt("/search");

    const toggle = await screen.findByRole("button", { name: content.filters_button });
    const desktop = window.matchMedia("(min-width: 64em)");

    // on mobile
    act(() => {
      desktop.dispatchEvent(new Event("change"));
    });

    await userEvent.click(toggle);
    expect(document.getElementById("search-filters")).toHaveClass("search-filters--open");

    await userEvent.click(screen.getByRole("button", { name: content.filters_done }));
    expect(document.getElementById("search-filters")).not.toHaveClass("search-filters--open");
    expect(toggle).toHaveFocus();

    await userEvent.click(toggle);
    expect(document.getElementById("search-filters")).toHaveClass("search-filters--open");

    // on desktop
    Object.assign(desktop, { matches: true });
    act(() => {
      desktop.dispatchEvent(new Event("change"));
    });
    expect(document.getElementById("search-filters")).not.toHaveClass("search-filters--open");

    Object.assign(desktop, { matches: false }); // cleanup
  });

  it("returns to the top of the page when the results page changes", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    searchListingsMock.mockResolvedValue({
      success: true,
      listings: [makeListing()],
      pagination: { page: 1, total: 41 },
    });

    renderAt("/search?location=Newark");

    const nextPage = await screen.findByRole("link", { name: common.pagination.nextPage });
    expect(scrollTo).not.toHaveBeenCalled();

    await userEvent.click(nextPage);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
    await waitFor(() =>
      expect(searchListingsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
        expect.any(AbortSignal),
      ),
    );
  });
});

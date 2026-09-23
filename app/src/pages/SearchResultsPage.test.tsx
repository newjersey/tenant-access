import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import content from "@/data/content/en/search-results.json";
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
});

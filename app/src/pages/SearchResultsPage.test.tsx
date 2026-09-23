import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import content from "@/data/content/en/search-results.json";
import { makeListing } from "@/test/makeListing";
import SearchResultsPage from "./SearchResultsPage";

const { searchListingsMock } = vi.hoisted(() => ({ searchListingsMock: vi.fn() }));

vi.mock("@/clients/listings", () => ({ searchListings: searchListingsMock }));
vi.mock("@/data/locations/cities-by-county.json", () => import("@/test/citiesByCounty"));

const resolveWith = (listings = [makeListing()], page = 1, total = listings.length) =>
  searchListingsMock.mockResolvedValue({
    success: true,
    listings,
    pagination: { page, total },
  });

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SearchResultsPage />
    </MemoryRouter>,
  );

describe("SearchResultsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveWith([]);
  });

  it("asks the API for the location, page, and filters in the URL", async () => {
    renderAt("/search?location=Newark&page=3&bedrooms=studio&bathrooms=2");

    expect(await screen.findByRole("combobox", { name: content.search_label })).toHaveValue(
      "Newark",
    );
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

  it("leaves the search box empty when no location is set", async () => {
    renderAt("/search");

    expect(await screen.findByRole("combobox", { name: content.search_label })).toHaveValue("");
  });

  it("starts a new search back at the first page", async () => {
    renderAt("/search?location=Newark&page=3");

    const box = await screen.findByRole("combobox", { name: content.search_label });
    await userEvent.clear(box);
    await userEvent.type(box, "Trenton{Enter}");
    await userEvent.click(screen.getByRole("button", { name: content.search_button }));

    expect(searchListingsMock).toHaveBeenLastCalledWith(
      { location: "Trenton", page: 1, sort: "updated", filters: {} },
      expect.any(AbortSignal),
    );
  });

  it("searches every location when the box is cleared", async () => {
    renderAt("/search?location=Newark");

    await screen.findByRole("combobox", { name: content.search_label });
    await userEvent.click(screen.getByRole("button", { name: "Clear the select contents" }));
    await userEvent.click(screen.getByRole("button", { name: content.search_button }));

    expect(searchListingsMock).toHaveBeenLastCalledWith(
      { location: null, page: 1, sort: "updated", filters: {} },
      expect.any(AbortSignal),
    );
  });

  it("refuses a city that is not on the list", async () => {
    renderAt("/search");

    const box = await screen.findByRole("combobox", { name: content.search_label });
    await userEvent.type(box, "Nonsense");
    expect(within(screen.getByRole("listbox")).queryByRole("option")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: content.search_button }));
    expect(searchListingsMock).toHaveBeenLastCalledWith(
      { location: null, page: 1, sort: "updated", filters: {} },
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

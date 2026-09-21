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

  it("asks the API for the location and page in the URL", async () => {
    renderAt("/search?location=Newark&page=3");

    expect(await screen.findByText(content.no_results)).toBeInTheDocument();
    expect(searchListingsMock).toHaveBeenCalledWith(
      { location: "Newark", page: 3, sort: "updated", filters: {} },
      expect.any(AbortSignal),
    );
  });

  it("titles the page and offers a way back home", async () => {
    renderAt("/search?location=Newark");

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(content.heading);
    expect(screen.getByRole("link", { name: content.home })).toHaveAttribute("href", "/");
  });

  it("seeds the search box from the location in the URL", async () => {
    renderAt("/search?location=Long+Branch");

    expect(await screen.findByRole("combobox", { name: content.search_label })).toHaveValue(
      "Long Branch",
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

  it("closes the filter drawer when the window grows to desktop width", async () => {
    renderAt("/search");

    await userEvent.click(await screen.findByRole("button", { name: content.filters_button }));
    expect(document.getElementById("search-filters")).toHaveClass("search-filters--open");

    const desktop = window.matchMedia("(min-width: 64em)");
    Object.assign(desktop, { matches: true });
    act(() => {
      desktop.dispatchEvent(new Event("change"));
    });

    expect(document.getElementById("search-filters")).not.toHaveClass("search-filters--open");
  });

  it("closes the drawer on Done, Esc, or clicking outside drawer", async () => {
    renderAt("/search");

    // done
    const toggle = await screen.findByRole("button", { name: content.filters_button });
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole("button", { name: content.filters_done }));
    expect(document.getElementById("search-filters")).not.toHaveClass("search-filters--open");
    expect(toggle).toHaveFocus();

    // click away
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole("button", { name: content.filters_close }));
    expect(document.getElementById("search-filters")).not.toHaveClass("search-filters--open");
    expect(toggle).toHaveFocus();

    // esc key
    await userEvent.click(toggle);
    expect(document.getElementById("search-filters")).toHaveClass("search-filters--open");
    await userEvent.keyboard("{ArrowDown}"); // just making sure other keys have no effect
    expect(document.getElementById("search-filters")).toHaveClass("search-filters--open");
    await userEvent.keyboard("{Escape}");
    expect(document.getElementById("search-filters")).not.toHaveClass("search-filters--open");
    expect(toggle).toHaveFocus();
  });

  it("filter choices save", async () => {
    renderAt("/search");

    const bedrooms = await screen.findByLabelText(content.filter_bedrooms);
    const bathrooms = screen.getByLabelText(content.filter_bathrooms);

    await userEvent.selectOptions(bedrooms, "studio");
    expect(bedrooms).toHaveValue("studio");

    await userEvent.selectOptions(bathrooms, "2");
    expect(bathrooms).toHaveValue("2");
    await userEvent.selectOptions(bathrooms, "any");
    expect(bathrooms).toHaveValue("any");
  });

  it("clears all filters", async () => {
    renderAt("/search?location=Newark&bedrooms=studio&bathrooms=2&page=2");

    const bedrooms = await screen.findByLabelText(content.filter_bedrooms);
    const bathrooms = screen.getByLabelText(content.filter_bathrooms);
    expect(bedrooms).toHaveValue("studio");
    expect(bathrooms).toHaveValue("2");

    await userEvent.click(screen.getByRole("button", { name: content.filters_clear }));

    expect(bedrooms).toHaveValue("any");
    expect(bathrooms).toHaveValue("any");
    expect(searchListingsMock).toHaveBeenLastCalledWith(
      { location: "Newark", page: 1, sort: "updated", filters: {} },
      expect.any(AbortSignal),
    );
  });

  it("removes a filter using the applied filter buttons", async () => {
    renderAt("/search?location=Newark&bedrooms=studio&bathrooms=2&page=2");

    const removeBedrooms = await screen.findByRole("button", {
      name: content.filters_remove.replace(
        "{{filter}}",
        `${content.filter_bedrooms}: ${content.filter_studio}`,
      ),
    });
    expect(
      screen.getByRole("button", {
        name: content.filters_remove.replace("{{filter}}", `${content.filter_bathrooms}: 2+`),
      }),
    ).toBeInTheDocument();

    await userEvent.click(removeBedrooms);

    expect(screen.getByLabelText(content.filter_bedrooms)).toHaveValue("any");
    expect(screen.getByLabelText(content.filter_bathrooms)).toHaveValue("2");
    expect(searchListingsMock).toHaveBeenLastCalledWith(
      { location: "Newark", page: 1, sort: "updated", filters: { bathrooms: "2" } },
      expect.any(AbortSignal),
    );
  });

  it("hides applied filters when none are set", async () => {
    renderAt("/search?location=Newark");

    expect(await screen.findByText(content.no_results)).toBeInTheDocument();
    expect(screen.queryByText(content.filters_applied)).toBeNull();
  });
});

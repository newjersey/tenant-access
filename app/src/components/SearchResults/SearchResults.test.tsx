import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SearchResults from "@/components/SearchResults/SearchResults";
import content from "@/data/content/en/search-results.json";
import type { SearchListingsState } from "@/hooks/useSearchListings";
import { makeListing } from "@/test/makeListing";

const ready = (
  listings = [makeListing()],
  page = 1,
  total = listings.length,
): SearchListingsState => ({
  status: "ready",
  listings,
  pagination: {
    page,
    total,
    pageSize: 0,
  },
});

const renderResults = (search: SearchListingsState) =>
  render(
    <MemoryRouter initialEntries={["/search"]}>
      <SearchResults search={search} />
    </MemoryRouter>,
  );

describe("SearchResults", () => {
  it("announces that listings are on the way", () => {
    renderResults({ status: "loading" });

    expect(screen.getByRole("status")).toHaveTextContent(content.loading);
  });

  it("shows an alert when the request failed", () => {
    renderResults({ status: "error" });

    expect(screen.getByRole("alert")).toHaveTextContent(content.error);
  });

  it("says so when nothing matched", () => {
    renderResults(ready([], 1, 0));

    expect(screen.getByText(content.no_results)).toBeInTheDocument();
    expect(screen.queryByLabelText(content.sort_label)).not.toBeInTheDocument();
  });

  it("renders one card per listing", () => {
    renderResults(ready([makeListing(), makeListing({ uid: 2, rent: 1300, rentMax: 1600 })]));

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("$1,200/month")).toBeInTheDocument();
    expect(screen.getByText("$1,300-$1,600/month")).toBeInTheDocument();
  });

  it("reports the result range for the first page of several", () => {
    renderResults(ready([makeListing()], 1, 41));

    expect(screen.getByText("Results 1 - 20 of 41")).toBeInTheDocument();
  });

  it("reports the result range for a single result", () => {
    renderResults(ready([makeListing()], 1, 1));

    expect(screen.getByText("Results 1 - 1 of 1")).toBeInTheDocument();
  });

  it("reports the result range deep into a later page", () => {
    renderResults(ready([makeListing()], 3, 41));

    expect(screen.getByText("Results 41 - 41 of 41")).toBeInTheDocument();
  });

  it("stops promising a total once the API stops counting", () => {
    renderResults(ready([makeListing()], 1, 1001));

    expect(screen.getByText("Results 1 - 20 of over 1,000")).toBeInTheDocument();
  });

  it("offers sorting and pagination alongside the results", () => {
    renderResults(ready([makeListing()], 1, 41));

    expect(screen.getByLabelText(content.sort_label)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });
});

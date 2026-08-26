import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SearchResultsPage from "./SearchResultsPage";

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SearchResultsPage />
    </MemoryRouter>,
  );

describe("SearchResultsPage", () => {
  it("reads the location and page from the URL", () => {
    renderAt("/search?location=Newark&page=3");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Find rental properties in Newark",
    );
    expect(screen.getByText("Page 3")).toBeInTheDocument();
  });

  it("falls back to all of New Jersey on the first page", () => {
    renderAt("/search");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Find rental properties in New Jersey",
    );
    expect(screen.getByText("Page 1")).toBeInTheDocument();
  });
});

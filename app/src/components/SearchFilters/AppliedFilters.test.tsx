import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AppliedFilters from "@/components/SearchFilters/AppliedFilters";
import content from "@/data/content/en/search-results.json";

function CurrentQuery() {
  return <output data-testid="query">{useLocation().search}</output>;
}

const renderAt = (url: string) => {
  render(
    <MemoryRouter initialEntries={[url]}>
      <AppliedFilters />
      <CurrentQuery />
    </MemoryRouter>,
  );
  return screen.getByTestId("query");
};

const removeLabel = (filter: string) => content.filters_remove.replace("{{filter}}", filter);
const REMOVE_BEDROOMS = removeLabel(`${content.filter_bedrooms_short}: ${content.filter_studio}`);
const REMOVE_BATHROOMS = removeLabel(`${content.filter_bathrooms_short}: 2+`);

describe("AppliedFilters", () => {
  it("shows nothing at all when no filters are set", () => {
    renderAt("/search?location=Newark");

    expect(screen.queryByText(content.filters_applied)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers one labelled button per filter set in the URL", () => {
    renderAt("/search?bedrooms=studio&bathrooms=2");

    expect(screen.getByText(content.filters_applied)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button").map((button) => button.getAttribute("aria-label")),
    ).toEqual([REMOVE_BEDROOMS, REMOVE_BATHROOMS]);
  });

  it("removes only the chosen filter and returns to the first page", async () => {
    const query = renderAt("/search?location=Newark&bedrooms=studio&bathrooms=2&page=2");

    await userEvent.click(screen.getByRole("button", { name: REMOVE_BEDROOMS }));

    expect(query).toHaveTextContent("location=Newark&bathrooms=2");
    expect(query.textContent).not.toContain("bedrooms");
    expect(query.textContent).not.toContain("page");
    expect(screen.getByRole("button", { name: REMOVE_BATHROOMS })).toBeInTheDocument();
  });
});

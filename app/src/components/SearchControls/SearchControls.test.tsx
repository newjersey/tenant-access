import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, StrictMode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SearchControls from "@/components/SearchControls/SearchControls";
import content from "@/data/content/en/search-results.json";

vi.mock("@/data/locations/cities-by-county.json", () => import("@/test/citiesByCounty"));

function CurrentQuery() {
  return <output data-testid="query">{useLocation().search}</output>;
}

const renderAt = (url: string, location: string | null = null) => {
  const onToggleFilters = vi.fn();
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[url]}>
        <SearchControls
          location={location}
          filtersOpen={false}
          onToggleFilters={onToggleFilters}
          toggleRef={createRef<HTMLButtonElement>()}
        />
        <CurrentQuery />
      </MemoryRouter>
    </StrictMode>,
  );
  return {
    onToggleFilters,
    box: screen.getByRole("combobox", { name: content.search_label }),
    query: screen.getByTestId("query"),
  };
};

describe("SearchControls", () => {
  it("searches as soon as a city is chosen, back at the first page", async () => {
    const { box, query } = renderAt("/search?location=Newark&page=3", "Newark");

    expect(box).toHaveValue("Newark");
    await userEvent.clear(box);
    await userEvent.type(box, "Trenton{Enter}");

    expect(query).toHaveTextContent("location=Trenton");
    expect(query.textContent).not.toContain("page");
  });

  it("searches every location when the box is cleared", async () => {
    const { box, query } = renderAt("/search?location=Newark", "Newark");

    await userEvent.click(screen.getByRole("button", { name: "Clear the select contents" }));

    expect(query.textContent).not.toContain("location");
    expect(box).toHaveValue("");
  });

  it("leaves the search alone while typing a city that is not on the list", async () => {
    const { box, query } = renderAt("/search?location=Newark", "Newark");

    await userEvent.clear(box);
    await userEvent.type(box, "xyz");
    expect(within(screen.getByRole("listbox")).queryByRole("option")).not.toBeInTheDocument();

    expect(query).toHaveTextContent("location=Newark");
    expect(box).toHaveValue("xyz");
  });

  it("filters closed at first, and button toggles", async () => {
    const { onToggleFilters } = renderAt("/search");

    const toggle = screen.getByRole("button", { name: content.filters_button });
    expect(toggle).toHaveAttribute("aria-controls", "search-filters");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(onToggleFilters).toHaveBeenCalledTimes(1);
  });
});

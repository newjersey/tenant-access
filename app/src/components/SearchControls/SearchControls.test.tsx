import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
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
    <MemoryRouter initialEntries={[url]}>
      <SearchControls
        location={location}
        filtersOpen={false}
        onToggleFilters={onToggleFilters}
        toggleRef={createRef<HTMLButtonElement>()}
      />
      <CurrentQuery />
    </MemoryRouter>,
  );
  return {
    onToggleFilters,
    box: screen.getByRole("combobox", { name: content.search_label }),
    submit: screen.getByRole("button", { name: content.search_button }),
    query: screen.getByTestId("query"),
  };
};

describe("SearchControls", () => {
  it("seeds box from url and starts a new search back at the first page", async () => {
    const { box, submit, query } = renderAt("/search?location=Newark&page=3", "Newark");

    expect(box).toHaveValue("Newark");
    await userEvent.clear(box);
    await userEvent.type(box, "Trenton{Enter}");
    await userEvent.click(submit);

    expect(query).toHaveTextContent("location=Trenton");
    expect(query.textContent).not.toContain("page");
  });

  it("searches every location when the box is cleared", async () => {
    const { box, submit, query } = renderAt("/search?location=Newark", "Newark");

    await userEvent.click(screen.getByRole("button", { name: "Clear the select contents" }));
    await userEvent.click(submit);

    expect(query.textContent).not.toContain("location");
    expect(box).toHaveValue("");
  });

  it("refuses a city that is not on the list", async () => {
    const { box, submit, query } = renderAt("/search");

    await userEvent.type(box, "xyz");
    expect(within(screen.getByRole("listbox")).queryByRole("option")).not.toBeInTheDocument();

    await userEvent.click(submit);
    expect(query.textContent).not.toContain("location");
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

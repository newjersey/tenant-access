import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SearchControls from "@/components/SearchControls/SearchControls";
import common from "@/data/content/en/common.json";
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
    query: screen.getByTestId("query"),
  };
};

describe("SearchControls", () => {
  it("searches city from url at correct page, searches new city back at the first page", async () => {
    const { box, query } = renderAt("/search?location=Newark&page=3", "Newark");

    expect(box).toHaveValue("Newark");
    expect(query).toHaveTextContent("page=3");
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

  it("reverts to searching all locations when url is for a city that is not on the list", async () => {
    const { box, query } = renderAt("/search?location=xyz", "xyz");

    expect(query.textContent).not.toContain("location");
    expect(box).toHaveValue("");
  });

  it("filters closed at first, and button toggles", async () => {
    const { onToggleFilters, query } = renderAt("/search?page=3");

    expect(query).toHaveTextContent("page=3");
    const toggle = screen.getByRole("button", { name: content.filters_button });
    expect(toggle).toHaveAttribute("aria-controls", "search-filters");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(onToggleFilters).toHaveBeenCalledTimes(1);
  });

  it("searches a ZIP only once it's complete, and again when it's cleared", async () => {
    const { query } = renderAt("/search?page=3");
    const zip = screen.getByRole("textbox", { name: common.locationSearch.zip });

    await userEvent.type(zip, "0860");
    expect(query).toHaveTextContent("page=3");
    expect(query.textContent).not.toContain("zip");

    await userEvent.type(zip, "8");
    expect(query).toHaveTextContent("zip=08608");
    expect(query.textContent).not.toContain("page");

    await userEvent.clear(zip);
    expect(query.textContent).not.toContain("zip");
  });

  it("fills the ZIP from the url", () => {
    renderAt("/search?zip=08608");

    expect(screen.getByRole("textbox", { name: common.locationSearch.zip })).toHaveValue("08608");
  });

  it("turns nearby listings off and back on", async () => {
    const { query } = renderAt("/search?location=Newark", "Newark");
    const nearby = screen.getByRole("checkbox", { name: common.locationSearch.nearby });

    expect(nearby).toBeChecked();
    await userEvent.click(nearby);
    expect(nearby).not.toBeChecked();
    expect(query).toHaveTextContent("nearby=false");

    await userEvent.click(nearby);
    expect(nearby).toBeChecked();
    expect(query.textContent).not.toContain("nearby");
  });

  it("explains a ZIP that isn't in New Jersey instead of searching it", async () => {
    const { query } = renderAt("/search?page=3");

    await userEvent.type(screen.getByRole("textbox", { name: common.locationSearch.zip }), "99999");

    expect(screen.getByRole("alert")).toHaveTextContent(common.locationSearch.zipError);
    expect(query).toHaveTextContent("page=3");
    expect(query.textContent).not.toContain("zip");
  });

  it("flags a non-NJ ZIP that arrives in the url", () => {
    renderAt("/search?zip=99999");

    expect(screen.getByRole("alert")).toHaveTextContent(common.locationSearch.zipError);
  });
});

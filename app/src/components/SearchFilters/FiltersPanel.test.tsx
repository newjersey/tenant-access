import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import FiltersPanel from "@/components/SearchFilters/FiltersPanel";
import content from "@/data/content/en/search-results.json";

function CurrentQuery() {
  return <output data-testid="query">{useLocation().search}</output>;
}

const renderAt = (url: string, open = false) => {
  const onClose = vi.fn();
  render(
    <MemoryRouter initialEntries={[url]}>
      <FiltersPanel open={open} onClose={onClose} />
      <CurrentQuery />
    </MemoryRouter>,
  );
  return {
    onClose,
    bedrooms: screen.getByLabelText(content.filter_bedrooms),
    bathrooms: screen.getByLabelText(content.filter_bathrooms),
    query: screen.getByTestId("query"),
    panel: document.getElementById("search-filters"),
  };
};

describe("FiltersPanel", () => {
  it("seeds both selects from the URL", () => {
    const { bedrooms, bathrooms } = renderAt("/search?bedrooms=studio&bathrooms=2");

    expect(bedrooms).toHaveValue("studio");
    expect(bathrooms).toHaveValue("2");
  });

  it("falls back to any when the URL asks for an option that does not exist", () => {
    const { bedrooms } = renderAt("/search?bedrooms=nonsense");

    expect(bedrooms).toHaveValue("any");
  });

  it("writes a chosen filter to the URL and returns to the first page", async () => {
    const { bedrooms, query } = renderAt("/search?location=Newark&page=3");

    await userEvent.selectOptions(bedrooms, "studio");

    expect(bedrooms).toHaveValue("studio");
    expect(query).toHaveTextContent("location=Newark&bedrooms=studio");
    expect(query.textContent).not.toContain("page");
  });

  it("drops a filter from the URL when it is set back to any", async () => {
    const { bathrooms, query } = renderAt("/search?bathrooms=2");

    await userEvent.selectOptions(bathrooms, "any");

    expect(bathrooms).toHaveValue("any");
    expect(query.textContent).not.toContain("bathrooms");
  });

  it("clears every filter at once, leaving the rest of the query alone", async () => {
    const { bedrooms, bathrooms, query } = renderAt(
      "/search?location=Newark&bedrooms=studio&bathrooms=2&page=2",
    );

    await userEvent.click(screen.getByRole("button", { name: content.filters_clear }));

    expect(bedrooms).toHaveValue("any");
    expect(bathrooms).toHaveValue("any");
    expect(query).toHaveTextContent("location=Newark");
    expect(query.textContent).not.toContain("page");
  });

  it("marks itself open and locks the page behind it", () => {
    const { panel } = renderAt("/search", true);

    expect(panel).toHaveClass("search-filters--open");
    expect(document.body).toHaveClass("filters-drawer-open");
  });

  it("asks to close on Done, on the overlay, and on Escape", async () => {
    const { onClose } = renderAt("/search", true);

    await userEvent.click(screen.getByRole("button", { name: content.filters_done }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: content.filters_close }));
    expect(onClose).toHaveBeenCalledTimes(2);

    await userEvent.keyboard("{ArrowDown}"); // other keys have no effect
    expect(onClose).toHaveBeenCalledTimes(2);

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("stays out of the way while closed", async () => {
    const { onClose, panel } = renderAt("/search");

    expect(panel).not.toHaveClass("search-filters--open");
    expect(document.body).not.toHaveClass("filters-drawer-open");
    expect(screen.queryByRole("button", { name: content.filters_close })).toBeNull();

    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });
});

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
    senior: screen.getByLabelText(content.filter_senior),
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
    const { bedrooms, bathrooms, senior, query } = renderAt(
      "/search?location=Newark&bedrooms=studio&bathrooms=2&senior=true&page=2",
    );

    await userEvent.click(screen.getByRole("button", { name: content.filters_clear }));

    expect(bedrooms).toHaveValue("any");
    expect(bathrooms).toHaveValue("any");
    expect(senior).not.toBeChecked();
    expect(query).toHaveTextContent("location=Newark");
    expect(query.textContent).not.toContain("page");
  });

  it("checks the senior housing toggle when the URL asks for it", () => {
    expect(renderAt("/search?senior=true").senior).toBeChecked();
  });

  it("leaves the senior housing toggle off for any value other than true", () => {
    expect(renderAt("/search?senior=1").senior).not.toBeChecked();
  });

  it("adds and removes the senior housing toggle, returning to the first page", async () => {
    const { senior, query } = renderAt("/search?location=Newark&page=4");

    await userEvent.click(senior);
    expect(senior).toBeChecked();
    expect(query).toHaveTextContent("location=Newark&senior=true");
    expect(query.textContent).not.toContain("page");

    await userEvent.click(senior);
    expect(senior).not.toBeChecked();
    expect(query.textContent).not.toContain("senior");
  });

  it("marks itself open and locks the page behind it", () => {
    const { panel } = renderAt("/search", true);

    expect(panel).toHaveClass("search-filters--open");
    expect(document.body).toHaveClass("filters-drawer-open");
  });

  it("asks to close on Done, X, overlay, or Escape", async () => {
    const { onClose } = renderAt("/search", true);

    await userEvent.click(screen.getByRole("button", { name: content.filters_done }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const [overlay, closeIcon] = screen.getAllByRole("button", { name: content.filters_close });

    await userEvent.click(closeIcon);
    expect(onClose).toHaveBeenCalledTimes(2);

    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(3);

    await userEvent.keyboard("{ArrowDown}"); // other keys have no effect
    expect(onClose).toHaveBeenCalledTimes(3);

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(4);
  });

  it("stays out of the way while closed", async () => {
    const { onClose, panel } = renderAt("/search");

    expect(panel).not.toHaveClass("search-filters--open");
    expect(document.body).not.toHaveClass("filters-drawer-open");
    expect(document.querySelector(".search-filters__overlay")).not.toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SortSelect from "@/components/SearchResults/SortSelect";
import content from "@/data/content/en/search-results.json";

function CurrentQuery() {
  return <output data-testid="query">{useLocation().search}</output>;
}

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SortSelect />
      <CurrentQuery />
    </MemoryRouter>,
  );

describe("SortSelect", () => {
  it("defaults to sorting by last updated", () => {
    renderAt("/search");

    expect(screen.getByLabelText(content.sort_label)).toHaveValue("updated");
  });

  it("reflects the sort already in the URL", () => {
    renderAt("/search?sort=price_desc");

    expect(screen.getByLabelText(content.sort_label)).toHaveValue("price_desc");
  });

  it("falls back to last updated when the URL asks for nonsense", () => {
    renderAt("/search?sort=sideways");

    expect(screen.getByLabelText(content.sort_label)).toHaveValue("updated");
  });

  it("writes the chosen sort to the URL and returns to the first page", async () => {
    renderAt("/search?location=Newark&page=3");

    await userEvent.selectOptions(
      screen.getByLabelText(content.sort_label),
      content.sort_price_asc,
    );

    expect(screen.getByLabelText(content.sort_label)).toHaveValue("price_asc");
    expect(screen.getByTestId("query")).toHaveTextContent("location=Newark&sort=price_asc");
    expect(screen.getByTestId("query").textContent).not.toContain("page");
  });
});

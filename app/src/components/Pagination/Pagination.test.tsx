import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Pagination from "@/components/Pagination/Pagination";

const renderAt = (url: string, page: number, total: number) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Pagination page={page} total={total} />
    </MemoryRouter>,
  );

describe("Pagination", () => {
  it("renders nothing when everything fits on one page", () => {
    renderAt("/search", 1, 12);

    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  });

  it("names every page when the range is small enough to bound", () => {
    renderAt("/search?page=2", 2, 41);

    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 3" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Page 4" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Previous page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next page" })).toBeInTheDocument();
  });

  it("omits the previous arrow on the first page", () => {
    renderAt("/search", 1, 41);

    expect(screen.getByRole("link", { name: "Next page" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Previous page" })).not.toBeInTheDocument;
  });

  it("omits the next arrow on the last page", () => {
    renderAt("/search?page=3", 3, 41);

    expect(screen.getByRole("link", { name: "Previous page" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Next page" })).not.toBeInTheDocument();
  });

  it("collapses the middle once the API stops counting", () => {
    renderAt("/search", 1, 1001);

    expect(screen.getByRole("link", { name: "Page 5" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Page 50" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent("...");
  });

  it("keeps the unbounded layout deep into a capped range", () => {
    renderAt("/search?page=45", 45, 1001);

    expect(screen.getByRole("link", { name: "Page 46" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Page 50" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next page" })).toBeInTheDocument();
  });

  it("carries the rest of the query through to every page link", () => {
    renderAt("/search?location=Long+Branch", 1, 41);

    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/search?location=Long+Branch&page=2",
    );
    expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute(
      "href",
      "/search?location=Long+Branch&page=3",
    );
  });
});

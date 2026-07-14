import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import HomePage from "./HomePage";

const renderHomePage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe("HomePage", () => {
  it("renders each county as a heading linking to its filtered results", () => {
    renderHomePage();

    const bergenLink = screen.getByRole("link", { name: "Bergen" });
    expect(bergenLink).toHaveAttribute("href", "/search?county=bergen");
  });

  it("renders each town under its county linking to filtered results", () => {
    renderHomePage();

    const foxHollowLink = screen.getByRole("link", { name: "Fox Hollow" });
    expect(foxHollowLink).toHaveAttribute("href", "/search?county=bergen&town=fox-hollow");
  });

  it("groups towns within their county section", () => {
    renderHomePage();

    const monmouthGroup = screen.getByRole("list", { name: "Monmouth" });
    expect(within(monmouthGroup).getByRole("link", { name: "Willow Creek" })).toBeInTheDocument();
    expect(
      within(monmouthGroup).queryByRole("link", { name: "Fox Hollow" }),
    ).not.toBeInTheDocument();
  });
});

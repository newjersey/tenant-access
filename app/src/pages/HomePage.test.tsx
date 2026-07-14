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
  it("links each county to its filtered results", () => {
    renderHomePage();

    const countyLink = screen.getByRole("link", { name: "View all properties in Atlantic" });
    expect(countyLink).toHaveAttribute("href", "/search?county=atlantic");
  });

  it("links each town to its filtered results within its county", () => {
    renderHomePage();

    const townLink = screen.getByRole("link", { name: "Atlantic City" });
    expect(townLink).toHaveAttribute("href", "/search?county=atlantic&town=atlantic-city");
  });

  it("groups each county's towns under its own disclosure", () => {
    renderHomePage();

    const atlanticGroup = screen.getByRole("group", { name: "Atlantic" });
    expect(within(atlanticGroup).getByRole("link", { name: "Atlantic City" })).toBeInTheDocument();
    expect(within(atlanticGroup).queryByRole("link", { name: "Newark" })).not.toBeInTheDocument();
  });
});

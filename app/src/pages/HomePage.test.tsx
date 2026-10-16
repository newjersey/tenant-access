import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import common from "@/data/content/en/common.json";
import content from "@/data/content/en/home.json";
import HomePage from "./HomePage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("@/data/locations/cities-by-county.json", () => import("@/test/citiesByCounty"));

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links to the full listings page", () => {
    renderPage();

    expect(screen.getByRole("link", { name: content.view_all })).toHaveAttribute("href", "/search");
  });

  it("searches all listings when no location is chosen", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: content.search_rentals }));

    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });

  it("searches within the chosen location", async () => {
    renderPage();

    const box = screen.getByRole("combobox", { name: content.location });
    await userEvent.type(box, "Trenton{Enter}");
    await userEvent.click(screen.getByRole("button", { name: content.search_rentals }));

    expect(mockNavigate).toHaveBeenCalledWith("/search?location=Trenton");
  });

  it("searches by ZIP code and can leave out nearby listings", async () => {
    renderPage();

    await userEvent.type(
      screen.getByRole("textbox", { name: common.locationSearch.zip }),
      "08-608",
    );
    await userEvent.click(screen.getByRole("checkbox", { name: common.locationSearch.nearby }));
    await userEvent.click(screen.getByRole("button", { name: content.search_rentals }));

    expect(mockNavigate).toHaveBeenCalledWith("/search?zip=08608&nearby=false");
  });

  it("sends only the ZIP when both a location and a ZIP are filled in", async () => {
    renderPage();

    await userEvent.type(
      screen.getByRole("combobox", { name: content.location }),
      "Trenton{Enter}",
    );
    await userEvent.type(screen.getByRole("textbox", { name: common.locationSearch.zip }), "08608");
    await userEvent.click(screen.getByRole("button", { name: content.search_rentals }));

    expect(mockNavigate).toHaveBeenCalledWith("/search?zip=08608");
  });

  it("includes nearby listings by default", () => {
    renderPage();

    expect(screen.getByRole("checkbox", { name: common.locationSearch.nearby })).toBeChecked();
  });

  it("explains a ZIP that isn't in New Jersey instead of searching it", async () => {
    renderPage();

    const zip = screen.getByRole("textbox", { name: common.locationSearch.zip });
    await userEvent.type(zip, "99999");
    await userEvent.click(screen.getByRole("button", { name: content.search_rentals }));

    expect(screen.getByRole("alert")).toHaveTextContent(common.locationSearch.zipError);
    expect(zip).toHaveAccessibleDescription(common.locationSearch.zipError);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

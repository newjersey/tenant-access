import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import content from "@/data/content/en/home.json";
import HomePage from "./HomePage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

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
    await userEvent.type(box, "Trenton");
    await userEvent.click(screen.getByRole("option", { name: "Trenton" }));
    await userEvent.click(screen.getByRole("button", { name: content.search_rentals }));

    expect(mockNavigate).toHaveBeenCalledWith("/search?location=Trenton");
  });
});

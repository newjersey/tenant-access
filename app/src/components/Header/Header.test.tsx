import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Header from "./Header";

describe("Header", () => {
  it("renders the component", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const headerEl = screen.getByRole("banner");
    expect(headerEl).toBeInTheDocument();
  });

  it("opens the menu when menu button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const menuButton = screen.getByRole("button", { name: /menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    expect(nav).toHaveClass("is-visible");
  });

  it("closes the menu when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const menuButton = screen.getByRole("button", { name: /menu/i });
    await user.click(menuButton);

    const closeButton = screen.getByRole("button", { name: /close navigation/i });
    await user.click(closeButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    expect(nav).not.toHaveClass("is-visible");
  });

  it("closes the menu when Escape key is pressed", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const menuButton = screen.getByRole("button", { name: /menu/i });
    await user.click(menuButton);

    await user.keyboard("{Escape}");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the menu when overlay is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const menuButton = screen.getByRole("button", { name: /menu/i });
    await user.click(menuButton);

    const overlay = document.querySelector(".usa-overlay");
    if (overlay) {
      await user.click(overlay);
    }

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the menu when navigation link is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const menuButton = screen.getByRole("button", { name: /menu/i });
    await user.click(menuButton);

    const signInLink = screen.getByRole("link", { name: /sign in/i });
    await user.click(signInLink);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus to close button when menu opens", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const menuButton = screen.getByRole("button", { name: /menu/i });
    await user.click(menuButton);

    const closeButton = screen.getByRole("button", { name: /close navigation/i });
    expect(closeButton).toHaveFocus();
  });

  it("returns focus to menu button when menu closes", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const menuButton = screen.getByRole("button", { name: /menu/i });
    await user.click(menuButton);

    const closeButton = screen.getByRole("button", { name: /close navigation/i });
    await user.click(closeButton);

    expect(menuButton).toHaveFocus();
  });

  it("does not trigger handler when Escape is pressed and menu is closed", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    // Press Escape while menu is closed
    await user.keyboard("{Escape}");

    // Verify menu stays closed
    const menuButton = screen.getByRole("button", { name: /menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});

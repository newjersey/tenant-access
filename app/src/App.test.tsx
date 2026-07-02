import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the app", () => {
    render(<App />);
    expect(screen.getByText(/Explore Vite/i)).toBeInTheDocument();
  });

  it("renders the counter button", () => {
    render(<App />);
    const button = screen.getByRole("button", { name: /count is/i });
    expect(button).toBeInTheDocument();
  });
});

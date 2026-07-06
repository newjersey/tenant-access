import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "./Footer";

describe("Footer", () => {
  it("renders the component", () => {
    render(<Footer />);

    const returnToTopLink = screen.getByRole("link", { name: /return to top/i });
    expect(returnToTopLink).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "./Footer";

describe("Footer", () => {
  it("renders the component", () => {
    render(<Footer />);

    const footerElement = screen.getByRole("region");
    expect(footerElement).toBeInTheDocument();
  });
});

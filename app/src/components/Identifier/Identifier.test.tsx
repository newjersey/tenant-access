import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Identifier from "./Identifier";

describe("Identifier", () => {
  it("renders the component", () => {
    render(<Identifier />);

    const copyrightText = screen.getByText(/© \d{4} State of New Jersey/i);
    expect(copyrightText).toBeInTheDocument();
  });
});

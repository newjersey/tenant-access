import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Identifier from "./Identifier";

describe("Identifier", () => {
  it("renders the component", () => {
    render(<Identifier />);

    const identifierElement = screen.getByRole("region");
    expect(identifierElement).toBeInTheDocument();
  });
});

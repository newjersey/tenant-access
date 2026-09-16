import { render, screen } from "@testing-library/react";
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
});

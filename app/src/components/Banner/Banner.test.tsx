import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Banner from "./Banner";

describe("Banner", () => {
  it("renders the component", () => {
    render(<Banner />);

    const bannerElement = screen.getByRole("region", { name: /official government website/i });
    expect(bannerElement).toBeInTheDocument();
  });
});

import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, vi } from "vitest";
import PropertyDetailsPage from "./PropertyDetailsPage";

vi.mock("@splidejs/react-splide", () => ({
  Splide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SplideSlide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("PropertyDetailsPage", () => {
  it("renders", () => {
    render(
      <BrowserRouter>
        <PropertyDetailsPage />
      </BrowserRouter>,
    );
  });
});

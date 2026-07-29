import { render } from "@testing-library/react";
import { describe, it, vi } from "vitest";
import RouteErrorFallback from "./RouteErrorFallback";

vi.mock("react-router-dom", () => ({
  useRouteError: () => new Error("Test error"),
}));

describe("RouteErrorFallback", () => {
  it("renders", () => {
    render(<RouteErrorFallback />);
  });
});

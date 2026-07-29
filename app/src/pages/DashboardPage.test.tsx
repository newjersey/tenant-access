import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it } from "vitest";
import DashboardPage from "./DashboardPage";

describe("DashboardPage", () => {
  it("renders", () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );
  });
});

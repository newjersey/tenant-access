import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it } from "vitest";
import SearchResultsPage from "./SearchResultsPage";

describe("SearchResultsPage", () => {
  it("renders", () => {
    render(
      <BrowserRouter>
        <SearchResultsPage />
      </BrowserRouter>,
    );
  });
});

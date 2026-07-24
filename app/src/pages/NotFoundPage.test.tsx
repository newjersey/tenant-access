import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it } from "vitest";
import NotFoundPage from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders", () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>,
    );
  });
});

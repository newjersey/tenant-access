import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import content from "@/data/content/en/createlisting.json";
import UpdateListingPage from "./UpdateListingPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("UpdateListingPage", () => {
  it("navigates to dashboard on form submit", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <UpdateListingPage />
      </BrowserRouter>,
    );

    const submitButton = screen.getByRole("button", { name: content.buttonUpdate });
    await user.click(submitButton);

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});

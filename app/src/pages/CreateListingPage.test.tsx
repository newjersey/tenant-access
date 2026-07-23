import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import content from "@/data/content/en/createlisting.json";
import CreateListingPage from "./CreateListingPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CreateListingPage", () => {
  it("navigates to dashboard on form submit", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreateListingPage />
      </BrowserRouter>,
    );

    // Fill in required fields
    await user.type(screen.getByLabelText(content.labelStreetAddress1), "123 Main St");
    await user.type(screen.getByLabelText(content.labelCity), "Newark");
    await user.selectOptions(screen.getByLabelText(content.labelState), "New Jersey");
    await user.type(screen.getByLabelText(content.labelZipCode), "07102");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: content.buttonSubmit });
    await user.click(submitButton);

    // Verify navigation was called
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});

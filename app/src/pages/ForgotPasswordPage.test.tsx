import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ForgotPasswordPage from "./ForgotPasswordPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("ForgotPasswordPage", () => {
  it("navigates to signin page on form submit", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>,
    );

    // Fill in required fields
    await user.type(screen.getByLabelText("New password"), "newPassword123");
    await user.type(screen.getByLabelText("Confirm password"), "newPassword123");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: "Reset password" });
    await user.click(submitButton);

    // Verify navigation was called
    expect(mockNavigate).toHaveBeenCalledWith("/signin");
  });
});

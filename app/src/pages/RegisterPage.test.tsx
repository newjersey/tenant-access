import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import content from "@/data/content/en/register.json";
import RegisterPage from "./RegisterPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("RegisterPage", () => {
  it("navigates to dashboard on form submit", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    // Fill in all fields
    await user.type(screen.getByLabelText(content.emailLabel), "test@example.com");
    await user.type(screen.getByLabelText(content.passwordLabel), "password123");
    await user.type(screen.getByLabelText(content.confirmPasswordLabel), "password123");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: content.formCta });
    await user.click(submitButton);

    // Verify navigation was called
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});

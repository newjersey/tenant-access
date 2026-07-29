import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SigninPage from "./SigninPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SigninPage", () => {
  it("handles form submission", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <SigninPage />
      </BrowserRouter>,
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // Submit
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});

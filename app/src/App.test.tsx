import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

describe("App", () => {
  it("renders the home page", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <App />,
          children: [
            {
              index: true,
              element: <HomePage />,
            },
          ],
        },
      ],
      {
        initialEntries: ["/"],
      },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByText(/Hello App/i)).toBeInTheDocument();
  });

  it("renders the login page", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <App />,
          children: [
            {
              path: "login",
              element: <LoginPage />,
            },
          ],
        },
      ],
      {
        initialEntries: ["/login"],
      },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });
});

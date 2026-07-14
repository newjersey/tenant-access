import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";
import homeContent from "./data/content/en/home.json";
import HomePage from "./pages/HomePage";
import SigninPage from "./pages/SigninPage";

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
    expect(
      screen.getByRole("heading", { level: 1, name: homeContent.heading }),
    ).toBeInTheDocument();
  });

  it("renders the signin page", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <App />,
          children: [
            {
              path: "signin",
              element: <SigninPage />,
            },
          ],
        },
      ],
      {
        initialEntries: ["/signin"],
      },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});

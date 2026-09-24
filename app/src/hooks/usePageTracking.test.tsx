import { act, render } from "@testing-library/react";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initAnalytics, trackPageView } from "@/utils/analytics";
import usePageTracking from "./usePageTracking";

vi.mock("@/utils/analytics", () => ({
  initAnalytics: vi.fn(),
  trackPageView: vi.fn(),
}));

function TrackingHost() {
  usePageTracking();
  return <Outlet />;
}

function makeRouter() {
  return createMemoryRouter(
    [
      {
        path: "/",
        element: <TrackingHost />,
        children: [
          { index: true, element: null },
          { path: "search", element: null },
        ],
      },
    ],
    { initialEntries: ["/"] },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePageTracking", () => {
  it("initializes analytics exactly once, even across navigation", async () => {
    const router = makeRouter();
    render(<RouterProvider router={router} />);

    await act(async () => {
      await router.navigate("/search");
    });

    expect(initAnalytics).toHaveBeenCalledTimes(1);
  });

  it("reports a page_view on first render and again on each route change", async () => {
    const router = makeRouter();
    render(<RouterProvider router={router} />);

    expect(trackPageView).toHaveBeenLastCalledWith("/");

    await act(async () => {
      await router.navigate("/search?location=Newark&bathroom=2");
    });

    expect(trackPageView).toHaveBeenLastCalledWith(
      expect.stringContaining("/search?location=Newark&bathroom=2"),
    );
  });
});

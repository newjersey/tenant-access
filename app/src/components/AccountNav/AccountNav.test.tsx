import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import content from "@/data/content/en/common.json";
import AccountNav from "./AccountNav";

const mockSession = (response: Partial<Response>) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
};

describe("AccountNav", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the email and a logout link when signed in", async () => {
    mockSession({ ok: true, json: async () => ({ signedIn: true, email: "pat@example.com" }) });
    render(<AccountNav />);

    expect(await screen.findByText("pat@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: content.header.logout })).toHaveAttribute(
      "href",
      "/auth/logout",
    );
  });

  it("shows a sign in link when signed out", async () => {
    mockSession({ ok: true, json: async () => ({ signedIn: false }) });
    render(<AccountNav />);

    expect(
      await screen.findByRole("link", { name: content.header.signinOrRegister }),
    ).toHaveAttribute("href", "/auth/login");
  });

  it("falls back to the sign in link when the session request fails", async () => {
    mockSession({ ok: false, status: 502 });
    render(<AccountNav />);

    expect(
      await screen.findByRole("link", { name: content.header.signinOrRegister }),
    ).toBeInTheDocument();
  });
});

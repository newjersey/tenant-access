import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Alert from "./Alert";

describe("Alert", () => {
  it("renders the children", () => {
    render(<Alert>Your listing was deleted</Alert>);

    expect(screen.getByText("Your listing was deleted")).toBeInTheDocument();
  });

  it("renders rich markup passed as children", () => {
    render(
      <Alert>
        Your <a href="/listings">listing was deleted</a>
      </Alert>,
    );

    expect(screen.getByRole("link", { name: "here" })).toBeInTheDocument();
  });

  it("renders the header text when a header is provided", () => {
    render(<Alert header="Success">Your listing was deleted</Alert>);

    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("omits the header when none is provided", () => {
    const { container } = render(<Alert>Your listing was deleted</Alert>);

    expect(container.querySelector(".usa-alert__heading")).not.toBeInTheDocument();
  });

  it("suppresses the header when slim is true", () => {
    const { container } = render(
      <Alert slim header="Success">
        Your listing was deleted
      </Alert>,
    );

    expect(container.querySelector(".usa-alert__heading")).not.toBeInTheDocument();
  });

  it("uses an assertive role for errors and warnings", () => {
    render(<Alert type="error">Something failed</Alert>);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("uses a polite role for success and info", () => {
    render(<Alert type="success">All good</Alert>);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

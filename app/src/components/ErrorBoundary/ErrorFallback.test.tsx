import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import ErrorFallback from "./ErrorFallback";

describe("ErrorFallback", () => {
  it("shows error details in development mode", () => {
    import.meta.env.DEV = true;

    const testError = new Error("Test error message");
    testError.stack = "Error: Test error\n  at TestComponent";

    render(<ErrorFallback error={testError} />);
  });
});

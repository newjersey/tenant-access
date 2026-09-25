import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SkeletonCard from "./SkeletonCard";

describe("SkeletonCard", () => {
  it("renders an inert placeholder card", () => {
    render(<SkeletonCard />);

    expect(screen.getByRole("listitem")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

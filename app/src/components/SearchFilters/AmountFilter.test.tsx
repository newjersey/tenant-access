import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import AmountFilter from "@/components/SearchFilters/AmountFilter";

const LABEL = "Maximum rent";

function MaxRent({ figure = "" }: { figure?: string }) {
  const [value, setValue] = useState(figure);

  return (
    <AmountFilter
      name="maxRent"
      label={LABEL}
      input={{ value, change: setValue, clear: () => setValue("") }}
    />
  );
}

describe("AmountFilter", () => {
  it("shows the figure it was given and keeps only the whole dollars typed", async () => {
    render(<MaxRent figure="1200" />);
    const amount = screen.getByLabelText(LABEL);

    expect(amount).toHaveValue("1200");
    expect(amount).toHaveAttribute("inputMode", "numeric");
    expect(screen.getByText("$")).toHaveAttribute("aria-hidden", "true");

    await userEvent.clear(amount);
    await userEvent.paste("$1,200.50");
    expect(amount).toHaveValue("1200");

    await userEvent.clear(amount);
    await userEvent.type(amount, "0a9.5");
    expect(amount).toHaveValue("95");

    await userEvent.clear(amount);
    expect(amount).toHaveValue("");
  });
});

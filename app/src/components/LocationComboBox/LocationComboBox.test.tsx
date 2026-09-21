import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LocationComboBox, { locationOptions } from "@/components/LocationComboBox/LocationComboBox";

import content from "@/data/content/en/common.json";

const ESSEX = locationOptions({ Essex: ["Newark", "Orange", "East Orange"] });
const renderBox = (props: Partial<Parameters<typeof LocationComboBox>[0]> = {}) => {
  const onChange = vi.fn();
  render(<LocationComboBox id="location" onChange={onChange} options={ESSEX} {...props} />);
  return { onChange, box: screen.getByRole("combobox") };
};

describe("locationOptions", () => {
  it("lists each county ahead of its cities and suffixes the county name", () => {
    expect(locationOptions({ Essex: ["Newark", "Orange"] })).toEqual([
      { value: "Essex County", label: "Essex County" },
      { value: "Newark", label: "Newark" },
      { value: "Orange", label: "Orange" },
    ]);
  });
});

describe("LocationComboBox", () => {
  const openList = async () =>
    userEvent.click(screen.getByRole("button", { name: "Toggle the dropdown list" }));

  it("offers every NJ county and city by default", async () => {
    render(<LocationComboBox id="location" onChange={vi.fn()} />);
    await openList();
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.length).toBeGreaterThan(300);
    expect(options.map((o) => o.textContent)).toContain("Essex County");
    expect(options.map((o) => o.textContent)).toContain("Newark");
  });

  it("suggests every real NJ city containing what was typed", async () => {
    render(<LocationComboBox id="location" onChange={vi.fn()} />);
    await userEvent.type(screen.getByRole("combobox"), "orange");
    expect(
      within(screen.getByRole("listbox"))
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Orange", "East Orange", "South Orange", "West Orange"]);
  });

  it("narrows to the options it is given", async () => {
    renderBox();
    await openList();
    expect(
      within(screen.getByRole("listbox"))
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Essex County", "Newark", "Orange", "East Orange"]);
  });

  it("suggests every option containing what was typed", async () => {
    const { box } = renderBox();
    await userEvent.type(box, "orange");
    expect(
      within(screen.getByRole("listbox"))
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Orange", "East Orange"]);
  });

  it("reports the chosen location", async () => {
    const { box, onChange } = renderBox();
    await userEvent.type(box, "Newark{Enter}");
    expect(box).toHaveValue("Newark");
    expect(onChange).toHaveBeenLastCalledWith("Newark");
  });

  it("seeds itself from a default value", () => {
    const { box } = renderBox({ defaultValue: "Orange" });
    expect(box).toHaveValue("Orange");
  });

  it("says so when nothing matches", async () => {
    const { box, onChange } = renderBox();
    await userEvent.type(box, "Nonsense");
    expect(within(screen.getByRole("listbox")).queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByText(content.locationComboBox.noResults)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalledWith("Nonsense");
  });
});

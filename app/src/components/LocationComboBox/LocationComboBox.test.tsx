import { describe, expect, it } from "vitest";
import { locationOptions } from "@/components/LocationComboBox/LocationComboBox";

describe("locationOptions", () => {
  it("lists each county ahead of its cities and suffixes the county name", () => {
    expect(locationOptions({ Essex: ["Newark", "Orange"] })).toEqual([
      { value: "Essex County", label: "Essex County" },
      { value: "Newark", label: "Newark" },
      { value: "Orange", label: "Orange" },
    ]);
  });
});

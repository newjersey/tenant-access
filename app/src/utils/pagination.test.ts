import { describe, expect, it } from "vitest";
import { paginationSlots } from "./pagination";

describe("paginationSlots when total is 1000 or fewer", () => {
  it("lists every page when they all fit", () => {
    expect(paginationSlots(1, 80)).toEqual([1, 2, 3, 4]);
    expect(paginationSlots(1, 100)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collapses the tail near the start of a long range", () => {
    expect(paginationSlots(2, 400)).toEqual([1, 2, 3, 4, 5, "overflow-end", 20]);
  });

  it("collapses both ends in the middle of a long range", () => {
    expect(paginationSlots(10, 400)).toEqual([1, "overflow-start", 9, 10, 11, "overflow-end", 20]);
  });

  it("collapses the head near the end of a long range", () => {
    expect(paginationSlots(19, 400)).toEqual([1, "overflow-start", 16, 17, 18, 19, 20]);
  });
});

describe("paginationSlots when the total is over 1000", () => {
  it("trails off in overflow instead of naming a last page", () => {
    expect(paginationSlots(1, 1001)).toEqual([1, 2, 3, 4, 5, "overflow-end"]);
    expect(paginationSlots(10, 1001)).toEqual([1, "overflow-start", 9, 10, 11, "overflow-end"]);
    expect(paginationSlots(45, 1001)).toEqual([1, "overflow-start", 44, 45, 46, "overflow-end"]);
  });

  it("drops the trailing overflow at the ceiling, where there is nothing left to promise", () => {
    expect(paginationSlots(49, 1001)).toEqual([1, "overflow-start", 48, 49, 50]);
    expect(paginationSlots(50, 1001)).toEqual([1, "overflow-start", 49, 50]);
  });
});

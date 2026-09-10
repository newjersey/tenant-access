import { describe, expect, it } from "vitest";
import {
  decodeOnlyRecent,
  encodeOnlyRecent,
  isRecentlyUpdated,
  readOnlyRecent,
  RECENT_WINDOW_DAYS,
} from "./recency.js";

describe("isRecentlyUpdated", () => {
  const scrapeDate = new Date("2026-07-24T00:00:00.000Z");

  it("includes everything the site labelled within the window", () => {
    expect(isRecentlyUpdated("2026-07-24T00:00:00.000Z", scrapeDate)).toBe(true); // just updated
    expect(isRecentlyUpdated("2026-07-19T00:00:00.000Z", scrapeDate)).toBe(true); // this week
    expect(isRecentlyUpdated("2026-07-10T00:00:00.000Z", scrapeDate)).toBe(true); // edge of window
  });

  it("excludes anything older than the window", () => {
    expect(isRecentlyUpdated("2026-07-09T00:00:00.000Z", scrapeDate)).toBe(false);
    expect(isRecentlyUpdated("2026-07-01T00:00:00.000Z", scrapeDate)).toBe(false); // this month
  });

  it("excludes listings the site never labelled", () => {
    expect(isRecentlyUpdated(null, scrapeDate)).toBe(false);
  });

  it("excludes an unparseable timestamp rather than treating it as fresh", () => {
    expect(isRecentlyUpdated("not a date", scrapeDate)).toBe(false);
  });

  it("measures against the scrape date, so reparsing an old file is stable", () => {
    const older = new Date("2026-07-10T00:00:00.000Z");
    expect(isRecentlyUpdated("2026-07-19T00:00:00.000Z", older)).toBe(true);
    expect(isRecentlyUpdated("2026-06-20T00:00:00.000Z", older)).toBe(false);
  });

  it("accepts a narrower window", () => {
    expect(isRecentlyUpdated("2026-07-15T00:00:00.000Z", scrapeDate, 7)).toBe(false);
    expect(isRecentlyUpdated("2026-07-15T00:00:00.000Z", scrapeDate, RECENT_WINDOW_DAYS)).toBe(true);
  });
});

describe("readOnlyRecent", () => {
  it("defaults to true", () => {
    expect(readOnlyRecent(undefined)).toBe(true);
  });

  it("passes real booleans through", () => {
    expect(readOnlyRecent(false)).toBe(false);
    expect(readOnlyRecent(true)).toBe(true);
  });

  it("rejects a quoted boolean rather than quietly skipping the backfill", () => {
    expect(() => readOnlyRecent("false")).toThrow("onlyRecent must be a boolean");
    expect(() => readOnlyRecent(0)).toThrow("onlyRecent must be a boolean");
  });
});

describe("onlyRecent S3 metadata", () => {
  it("round-trips both values", () => {
    expect(decodeOnlyRecent(encodeOnlyRecent(false))).toBe(false);
    expect(decodeOnlyRecent(encodeOnlyRecent(true))).toBe(true);
  });

  it("falls back to the default when the object predates the flag", () => {
    expect(decodeOnlyRecent(undefined)).toBe(true);
    expect(decodeOnlyRecent({})).toBe(true);
  });
});

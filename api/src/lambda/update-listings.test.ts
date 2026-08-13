import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing } from "../scraper/parser.js";
import { handler } from "./update-listings.js";

const { getClientMock, queryMock, endMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
  queryMock: vi.fn(),
  endMock: vi.fn(),
}));

vi.mock("./db.js", () => ({
  getClient: getClientMock,
}));

// Minimal valid-ish Listing; only fields the handler reads matter here.
function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    uid: 1002997,
    name: "Lexington Manor Apartments",
    address: "451 Bergen Ave",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07305",
    rent: 500,
    bedrooms: 3,
    bathrooms: 1.5,
    unitType: "Apartments",
    imageId: null,
    imageUrl: null,
    phoneNumber: "201-324-2969",
    website: null,
    description: null,
    lastUpdated: "2026-07-24T00:00:00.000Z",
    isWaitlistOpen: true,
    amenities: ["No Smoking"],
    contactName: "Hansel Cabrera",
    contactOrganization: "Lexington Manor",
    fullListingUrl: "https://example.com/1002997",
    rentType: "Standard Rent",
    depositRange: "$0 - $750",
    ...overrides,
  };
}

describe("insert-listings handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    getClientMock.mockResolvedValue({ query: queryMock, end: endMock });
    queryMock.mockResolvedValue({ rowCount: 1 });
    endMock.mockResolvedValue(undefined);
  });

  it("returns inserted:0 and never connects when given no listings", async () => {
    const result = await handler({ listings: [] });

    expect(JSON.parse(result.body)).toEqual({
      success: true,
      inserted: 0,
      message: "No listings provided",
    });
    expect(getClientMock).not.toHaveBeenCalled();
  });

  it("treats a missing listings field as empty", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: exercising the `?? []` guard with a malformed event
    const result = await handler({} as any);

    expect(JSON.parse(result.body)).toMatchObject({ inserted: 0 });
    expect(getClientMock).not.toHaveBeenCalled();
  });

  it("wraps inserts in a transaction and commits", async () => {
    const listings = [makeListing({ uid: 1 }), makeListing({ uid: 2 })];

    const result = await handler({ listings });

    expect(JSON.parse(result.body)).toEqual({ success: true, inserted: 2 });

    // BEGIN, one INSERT per listing, COMMIT.
    expect(queryMock).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO listings"),
      expect.arrayContaining([1]),
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO listings"),
      expect.arrayContaining([2]),
    );
    expect(queryMock).toHaveBeenNthCalledWith(4, "COMMIT");
    expect(endMock).toHaveBeenCalledOnce();
  });

  it("passes the listing fields as ordered parameters", async () => {
    const listing = makeListing({ uid: 42, amenities: ["Elevator"] });

    await handler({ listings: [listing] });

    const insertCall = queryMock.mock.calls.find(([sql]) =>
      String(sql).startsWith("INSERT INTO listings"),
    );
    const params = insertCall?.[1] as unknown[];

    // uid is first, amenities array is passed through as a single param.
    expect(params[0]).toBe(42);
    expect(params).toContainEqual(["Elevator"]);
    expect(params).toHaveLength(23);
  });

  it("rolls back and returns 500 when an insert fails", async () => {
    queryMock.mockImplementation((sql: string) => {
      if (sql === "BEGIN") return Promise.resolve({});
      if (String(sql).startsWith("INSERT")) {
        return Promise.reject(new Error("null value in column violates not-null"));
      }
      return Promise.resolve({}); // ROLLBACK
    });

    const result = await handler({ listings: [makeListing()] });

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      success: false,
      error: "null value in column violates not-null",
    });
    expect(queryMock).toHaveBeenCalledWith("ROLLBACK");
    expect(endMock).toHaveBeenCalledOnce();
  });

  it("survives a failed ROLLBACK (the .catch swallows it)", async () => {
    queryMock.mockImplementation((sql: string) => {
      if (String(sql).startsWith("INSERT")) return Promise.reject(new Error("insert boom"));
      if (sql === "ROLLBACK") return Promise.reject(new Error("rollback boom"));
      return Promise.resolve({});
    });

    const result = await handler({ listings: [makeListing()] });

    // Original insert error is reported, not the rollback error.
    expect(JSON.parse(result.body)).toEqual({
      success: false,
      error: "insert boom",
    });
    expect(endMock).toHaveBeenCalledOnce();
  });

  it("stringifies non-Error throwables", async () => {
    getClientMock.mockRejectedValue("connection refused");

    const result = await handler({ listings: [makeListing()] });

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      success: false,
      error: "connection refused",
    });
  });
});

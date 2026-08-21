import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "./query-listings.js";

const { getClientMock, queryMock, endMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
  queryMock: vi.fn(),
  endMock: vi.fn(),
}));

vi.mock("./db.js", () => ({
  getClient: getClientMock,
}));

const sampleRow = {
  uid: 1002997,
  lastUpdated: "2026-07-24T00:00:00.000Z",
  name: "Lexington Manor Apartments",
  city: "Jersey City",
  bedrooms: 3,
  bathrooms: 1.5,
  isWaitlistOpen: true,
  amenities: ["No Smoking"],
};

describe("query-listings handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // getClient resolves to a connected client stub.
    getClientMock.mockResolvedValue({ query: queryMock, end: endMock });
    queryMock.mockResolvedValue({ rowCount: 1, rows: [sampleRow] });
    endMock.mockResolvedValue(undefined);
  });

  it("returns a 200 with the count and rows", async () => {
    const result = await handler();

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      success: true,
      count: 1,
      listings: [sampleRow],
    });
    expect(endMock).toHaveBeenCalledOnce();
  });

  it("returns a 500 with the message when the query fails", async () => {
    queryMock.mockRejectedValue(new Error("connection terminated unexpectedly"));

    const result = await handler();

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      success: false,
      error: "connection terminated unexpectedly",
    });
    // finally block must still close the client on error.
    expect(endMock).toHaveBeenCalledOnce();
  });
});

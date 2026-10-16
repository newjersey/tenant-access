import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "./query-listings.js";

const { getClientMock, queryMock, endMock, s3SendMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
  queryMock: vi.fn(),
  endMock: vi.fn(),
  s3SendMock: vi.fn(),
}));

vi.mock("./db.js", () => ({
  getClient: getClientMock,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = s3SendMock;
  },
  PutObjectCommand: class {
    constructor(public input: { Bucket: string; Key: string; Body: string }) {}
  },
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
    process.env.BUCKET_NAME = "test-bucket";
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // getClient resolves to a connected client stub.
    getClientMock.mockResolvedValue({ query: queryMock, end: endMock });
    queryMock.mockResolvedValue({ rowCount: 1, rows: [sampleRow] });
    endMock.mockResolvedValue(undefined);
    s3SendMock.mockResolvedValue({});
  });

  it("writes the rows to S3 and returns the count and location", async () => {
    const result = await handler();

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toMatchObject({ success: true, count: 1 });
    expect(body.location).toMatch(/^s3:\/\/test-bucket\/query-results\/.+\.json$/);

    const { input } = s3SendMock.mock.calls[0][0];
    expect(`s3://${input.Bucket}/${input.Key}`).toBe(body.location);
    expect(JSON.parse(input.Body)).toEqual([sampleRow]);
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

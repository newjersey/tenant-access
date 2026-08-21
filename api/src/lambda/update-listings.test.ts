import type { S3Event } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing } from "../scraper/parser.js";
import { handler } from "./update-listings.js";

const { getClientMock, queryMock, endMock, s3SendMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
  queryMock: vi.fn(),
  endMock: vi.fn(),
  s3SendMock: vi.fn(),
}));

vi.mock("./db.js", () => ({ getClient: getClientMock }));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = s3SendMock;
  },
  GetObjectCommand: class {
    constructor(readonly input: { Bucket: string; Key: string }) {}
  },
}));

// Only uid is read by the assertions; the rest bind as undefined against a mock.
function listings(count: number): Listing[] {
  return Array.from({ length: count }, (_, i) => ({ uid: 10_000 + i }) as unknown as Listing);
}

function event(): S3Event {
  return {
    Records: [{ s3: { object: { key: "parsed/2026-08-18/listings.json" } } }],
  } as unknown as S3Event;
}

function serve(rows: Listing[]) {
  s3SendMock.mockResolvedValue({
    Body: { transformToString: async () => JSON.stringify(rows) },
  });
}

function shownCount(count: number) {
  queryMock.mockImplementation((sql: string) =>
    String(sql).startsWith("SELECT COUNT(*)")
      ? Promise.resolve({ rows: [{ count: String(count) }] })
      : Promise.resolve({ rowCount: 0 }),
  );
}

describe("update-listings handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    process.env.BUCKET_NAME = "test-bucket";
    getClientMock.mockResolvedValue({ query: queryMock, end: endMock });
    endMock.mockResolvedValue(undefined);
    shownCount(0);
    serve(listings(2));
  });

  it("throws when BUCKET_NAME is unset", async () => {
    delete process.env.BUCKET_NAME;

    await expect(handler(event())).rejects.toThrow("BUCKET_NAME is not set");
    expect(s3SendMock).not.toHaveBeenCalled();
    expect(getClientMock).not.toHaveBeenCalled();
  });

  it("returns early when the event has no records", async () => {
    const result = await handler({ Records: [] } as unknown as S3Event);

    expect(JSON.parse(result.body)).toMatchObject({ success: true });
    expect(getClientMock).not.toHaveBeenCalled();
  });

  it("reads the key from the event and commits the upsert", async () => {
    const result = await handler(event());

    expect(s3SendMock.mock.calls[0][0].input).toEqual({
      Bucket: "test-bucket",
      Key: "parsed/2026-08-18/listings.json",
    });
    expect(JSON.parse(result.body)).toMatchObject({ success: true, upserted: 2 });
    expect(queryMock).toHaveBeenCalledWith("BEGIN");
    expect(queryMock).toHaveBeenCalledWith("COMMIT");
    expect(endMock).toHaveBeenCalledOnce();
  });

  it("refuses a degraded run without writing anything", async () => {
    serve(listings(500));
    shownCount(3000);

    const result = await handler(event());

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toMatch(/below safety floor 2400/);
    expect(queryMock).not.toHaveBeenCalledWith("BEGIN");
  });

  it("rolls back and returns 500 when an insert fails", async () => {
    queryMock.mockImplementation((sql: string) => {
      if (String(sql).startsWith("SELECT COUNT(*)")) {
        return Promise.resolve({ rows: [{ count: "0" }] });
      }
      if (String(sql).startsWith("INSERT")) return Promise.reject(new Error("boom"));
      return Promise.resolve({ rowCount: 0 });
    });

    const result = await handler(event());

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ success: false, error: "boom" });
    expect(queryMock).toHaveBeenCalledWith("ROLLBACK");
  });
});

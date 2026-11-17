import type { S3Event } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GeocodeAddress } from "../geocoder/census.js";
import type { Listing } from "../scraper/parser.js";
import { handler } from "./update-listings.js";

const { getClientMock, queryMock, endMock, s3SendMock, sqsSendMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
  queryMock: vi.fn(),
  endMock: vi.fn(),
  s3SendMock: vi.fn(),
  sqsSendMock: vi.fn(),
}));

vi.mock("./db.js", () => ({ getClient: getClientMock }));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = s3SendMock;
  },
  GetObjectCommand: class {
    constructor(readonly input: { Bucket: string; Key: string }) {}
  },
  PutObjectCommand: class {
    constructor(readonly input: { Bucket: string; Key: string; Body: string }) {}
  },
}));

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: class {
    send = sqsSendMock;
  },
  SendMessageBatchCommand: class {
    constructor(readonly input: { QueueUrl: string; Entries: { Id: string }[] }) {}
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

function shownCount(
  count: number,
  needsDetails: number[] = [],
  needsGeocode: GeocodeAddress[] = [],
) {
  queryMock.mockImplementation((sql: string) => {
    if (String(sql).startsWith("SELECT COUNT(*)")) {
      return Promise.resolve({ rows: [{ count: String(count) }] });
    }
    if (String(sql).includes("geocoded_at IS NULL")) {
      return Promise.resolve({ rows: needsGeocode });
    }
    if (String(sql).startsWith("SELECT uid")) {
      return Promise.resolve({ rows: needsDetails.map((uid) => ({ uid })) });
    }
    return Promise.resolve({ rowCount: 0, rows: [] });
  });
}

describe("update-listings handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    process.env.BUCKET_NAME = "test-bucket";
    process.env.DETAILS_QUEUE_URL = "https://sqs.test/details";
    sqsSendMock.mockResolvedValue({});
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

    await expect(handler(event())).rejects.toThrow(/below safety floor 2400/);
    expect(queryMock).not.toHaveBeenCalledWith("BEGIN");
    expect(endMock).toHaveBeenCalledOnce();
  });

  it("rolls back when an insert fails", async () => {
    queryMock.mockImplementation((sql: string) => {
      if (String(sql).startsWith("SELECT COUNT(*)")) {
        return Promise.resolve({ rows: [{ count: "0" }] });
      }
      if (String(sql).startsWith("INSERT")) return Promise.reject(new Error("boom"));
      return Promise.resolve({ rowCount: 0 });
    });

    await expect(handler(event())).rejects.toThrow("boom");
    expect(queryMock).toHaveBeenCalledWith("ROLLBACK");
    expect(endMock).toHaveBeenCalledOnce();
  });

  it("throws when DETAILS_QUEUE_URL is unset", async () => {
    delete process.env.DETAILS_QUEUE_URL;

    await expect(handler(event())).rejects.toThrow("DETAILS_QUEUE_URL is not set");
    expect(getClientMock).not.toHaveBeenCalled();
  });

  it("enqueues every listing needing details, ten to a batch", async () => {
    shownCount(
      0,
      Array.from({ length: 25 }, (_, i) => 500 + i),
    );

    const result = await handler(event());

    expect(JSON.parse(result.body)).toMatchObject({ enqueued: 25 });
    expect(sqsSendMock).toHaveBeenCalledTimes(3);
    expect(sqsSendMock.mock.calls[0][0].input.QueueUrl).toBe("https://sqs.test/details");
    expect(sqsSendMock.mock.calls[0][0].input.Entries).toHaveLength(10);
    expect(sqsSendMock.mock.calls[2][0].input.Entries).toHaveLength(5);
    expect(sqsSendMock.mock.calls[0][0].input.Entries[0]).toEqual({
      Id: "500",
      MessageBody: '{"uid":500}',
    });
  });

  it("discounts entries the queue rejected instead of failing the run", async () => {
    shownCount(0, [500, 501]);
    sqsSendMock.mockResolvedValue({ Failed: [{ Id: "500" }] });

    expect(JSON.parse((await handler(event())).body)).toMatchObject({ enqueued: 1 });
  });

  it("writes no geocode request when every listing has a geocode", async () => {
    const result = await handler(event());

    expect(JSON.parse(result.body)).toMatchObject({ geocodeRequested: 0 });
    expect(s3SendMock).toHaveBeenCalledOnce();
  });

  it("writes listings missing a geocode to geocode-requests/", async () => {
    const needsGeocode: GeocodeAddress[] = [
      { uid: 600, address: "1 Main St", city: "Trenton", state: "NJ", zipCode: "08608" },
    ];
    shownCount(0, [], needsGeocode);

    const result = await handler(event());

    expect(JSON.parse(result.body)).toMatchObject({ geocodeRequested: 1 });
    expect(s3SendMock.mock.calls[1][0].input).toEqual({
      Bucket: "test-bucket",
      Key: expect.stringMatching(/^geocode-requests\/.+\.json$/),
      Body: JSON.stringify(needsGeocode),
      ContentType: "application/json",
    });
  });

  it("fails the run when the geocode request can't be written", async () => {
    shownCount(0, [500], [{ uid: 600 } as GeocodeAddress]);
    s3SendMock
      .mockResolvedValueOnce({
        Body: { transformToString: async () => JSON.stringify(listings(2)) },
      })
      .mockRejectedValueOnce(new Error("AccessDenied"));

    await expect(handler(event())).rejects.toThrow("AccessDenied");
    // details were already on their way; only the geocode step is retried
    expect(sqsSendMock).toHaveBeenCalledOnce();
    expect(endMock).toHaveBeenCalledOnce();
  });
});

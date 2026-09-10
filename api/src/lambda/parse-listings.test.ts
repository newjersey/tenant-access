import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { S3Event } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ParsedListings } from "../scraper/parser.js";
import { handler } from "./parse-listings.js";

const { s3SendMock } = vi.hoisted(() => ({ s3SendMock: vi.fn() }));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = s3SendMock;
  },
  GetObjectCommand: class {
    readonly type = "get";
    constructor(readonly input: { Bucket: string; Key: string }) {}
  },
  PutObjectCommand: class {
    readonly type = "put";
    constructor(readonly input: { Bucket: string; Key: string; Body: string; Metadata?: Record<string, string> }) {}
  },
}));

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleHtml = readFileSync(
  join(__dirname, "../../fixtures/sample-listings-2026july24.html"),
  "utf-8",
);

function event(key = "raw/2026-07-24/listings.html"): S3Event {
  return { Records: [{ s3: { object: { key } } }] } as unknown as S3Event;
}

function serve(html: string, metadata?: Record<string, string>) {
  s3SendMock.mockImplementation((command: { type: string }) =>
    command.type === "get"
      ? Promise.resolve({ Body: { transformToString: async () => html }, Metadata: metadata })
      : Promise.resolve({}),
  );
}

function puts() {
  return s3SendMock.mock.calls.map(([c]) => c).filter((c) => c.type === "put");
}

describe("parse-listings handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    process.env.BUCKET_NAME = "test-bucket";
    serve(sampleHtml);
  });

  it("throws when BUCKET_NAME is unset", async () => {
    delete process.env.BUCKET_NAME;

    await expect(handler(event())).rejects.toThrow("BUCKET_NAME is not set");
  });

  it("parses the raw html and writes listings.json under the date prefix", async () => {
    const result = await handler(event());

    expect(s3SendMock.mock.calls[0][0].input).toEqual({
      Bucket: "test-bucket",
      Key: "raw/2026-07-24/listings.html",
    });

    const [listingsPut] = puts();
    expect(listingsPut.input.Key).toBe("parsed/2026-07-24/listings.json");
    expect(result.parsed).toEqual([
      { key: "parsed/2026-07-24/listings.json", count: 4, refresh: 3 },
    ]);
  });

  it("throws when the key has no date", async () => {
    await expect(handler(event("raw/listings.html"))).rejects.toThrow("No date found in key");
  });

  it("refuses to write an empty result", async () => {
    serve("<html><body>no row_info</body></html>");

    await expect(handler(event())).rejects.toThrow("Parsed 0 listings");
    expect(puts()).toHaveLength(0);
  });

  it("carries every uid but only the recently labelled listings", async () => {
    await handler(event());

    const envelope = JSON.parse(puts()[0].input.Body) as ParsedListings;
    expect(envelope.uids).toEqual([1207170, 1002997, 1388803, 1388536]);
    // 1388536 is "Updated This Month", which resolves to 2026-07-01 — outside the window.
    expect(envelope.listings.map((l) => l.uid)).toEqual([1207170, 1002997, 1388803]);
  });

  it("carries every listing when the scrape asked for a full sweep", async () => {
    serve(sampleHtml, { "only-recent": "false" });

    const result = await handler(event());

    const envelope = JSON.parse(puts()[0].input.Body) as ParsedListings;
    expect(envelope.uids).toHaveLength(4);
    // 1388536 is "Updated This Month", which resolves to 2026-07-01 — outside the window.
    expect(envelope.listings).toHaveLength(4);
    expect(result.parsed[0].refresh).toBe(4);
  });
});

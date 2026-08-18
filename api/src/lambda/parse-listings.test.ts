import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { S3Event } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    constructor(readonly input: { Bucket: string; Key: string; Body: string }) {}
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

/** Answer GetObject with html; accept the PutObject. */
function serve(html: string) {
  s3SendMock.mockImplementation((command: { type: string }) =>
    command.type === "get"
      ? Promise.resolve({ Body: { transformToString: async () => html } })
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
    expect(JSON.parse(listingsPut.input.Body).map((l: { uid: number }) => l.uid)).toEqual([
      1002997, 1388803, 1388536,
    ]);
    expect(result.parsed).toEqual([{ key: "parsed/2026-07-24/listings.json", count: 3 }]);
  });

  it("throws when the key has no date", async () => {
    await expect(handler(event("raw/listings.html"))).rejects.toThrow("No date found in key");
  });

  it("refuses to write an empty result", async () => {
    serve("<html><body>no row_info</body></html>");

    await expect(handler(event())).rejects.toThrow("Parsed 0 listings");
    expect(puts()).toHaveLength(0);
  });
});

import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "./scrape-listings.js";

const { uploadCtorMock, uploadDoneMock } = vi.hoisted(() => ({
  uploadCtorMock: vi.fn(),
  uploadDoneMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => ({ S3Client: class {} }));

vi.mock("@aws-sdk/lib-storage", () => ({
  Upload: class {
    constructor(config: unknown) {
      uploadCtorMock(config);
    }
    done = uploadDoneMock;
  },
}));

/** Stand-in for a fetch Response with a web-stream body. */
function response({ ok = true, status = 200, bytes = 14_000_000 } = {}) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Forbidden",
    body: ok ? Readable.toWeb(Readable.from(["<html></html>"])) : null,
    headers: new Headers({ "content-length": String(bytes) }),
  };
}

function stubFetch(value = response()) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(value));
}

describe("scrape-listings handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});

    process.env.BUCKET_NAME = "test-bucket";
    delete process.env.RAW_PREFIX;
    uploadDoneMock.mockResolvedValue(undefined);
    // Fixed clock so the date-based key is deterministic.
    vi.setSystemTime(new Date("2026-08-18T15:00:00Z"));
    stubFetch();
  });

  it("throws when BUCKET_NAME is unset", async () => {
    delete process.env.BUCKET_NAME;

    await expect(handler()).rejects.toThrow("BUCKET_NAME is not set");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("streams the fetched page to a date-based key", async () => {
    const result = await handler();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("myhousingsearch.com/dbh/SearchHousingSubmit.html"),
      expect.any(Object),
    );
    expect(uploadCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          Bucket: "test-bucket",
          Key: "raw/2026-08-18/listings.html",
          ContentType: "text/html",
        }),
      }),
    );
    expect(uploadDoneMock).toHaveBeenCalledOnce();
    expect(result).toEqual({ bucket: "test-bucket", key: "raw/2026-08-18/listings.html" });
  });

  it("throws without uploading when the fetch fails", async () => {
    stubFetch(response({ ok: false, status: 403 }));

    await expect(handler()).rejects.toThrow("Fetch failed: 403");
    expect(uploadCtorMock).not.toHaveBeenCalled();
  });

  it("throws without uploading when the response is suspiciously small", async () => {
    stubFetch(response({ bytes: 4096 }));

    await expect(handler()).rejects.toThrow("Response only 4096 bytes");
    expect(uploadCtorMock).not.toHaveBeenCalled();
  });
});

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SQSEvent } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIXTURE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../fixtures/legacy-listing-1388803.html"),
  "utf-8",
);

const { end, getClient, storePhotos, writeListingDetails } = vi.hoisted(() => {
  const end = vi.fn(async () => {});
  return {
    end,
    getClient: vi.fn(async () => ({ end })),
    storePhotos: vi.fn(async () => ["photos/1388803/3010129.jpg"]),
    writeListingDetails: vi.fn(async () => {}),
  };
});

vi.mock("@aws-sdk/client-s3", () => ({ S3Client: class {} }));
vi.mock("./db.js", () => ({ getClient }));
vi.mock("./photo-store.js", () => ({ storePhotos }));
vi.mock("./write-details.js", () => ({ writeListingDetails }));

const { handler } = await import("./scrape-details.js");

// a heading we have never seen, and no availability line at all
const SURPRISING = `<html><body>
  <div class="tabularSection">
    <div class="tabularHeading">Specialized Information</div>
    <table class="tabularDetails"><tr><td class="tbL">Listing ID</td><td class="tbC">42</td></tr></table>
  </div>
  <div class="tabularSection">
    <div class="tabularHeading">Pickleball Amenities</div>
    <table class="tabularDetails"><tr><td class="tbL">Courts</td><td class="tbC">2</td></tr></table>
  </div>
</body></html>`;

function event(...uids: number[]): SQSEvent {
  return {
    Records: uids.map((uid) => ({ messageId: `msg-${uid}`, body: JSON.stringify({ uid }) })),
  } as unknown as SQSEvent;
}

function stubFetch(html: string, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok,
      status: 503,
      statusText: "Service Unavailable",
      text: async () => html,
    })),
  );
}

beforeEach(() => {
  process.env.IMAGES_BUCKET_NAME = "images";
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("scrape-details handler", () => {
  it("hands the parsed page to the photo store and then to the database", async () => {
    stubFetch(FIXTURE);

    expect(await handler(event(1388803))).toEqual({ scraped: 1 });

    expect(storePhotos).toHaveBeenCalledWith(expect.anything(), "images", 1388803, [
      "https://www.myhousingsearch.com/WebFile?id=3010129",
      "https://www.myhousingsearch.com/WebFile?id=3010132",
    ]);
    expect(writeListingDetails).toHaveBeenCalledWith(
      { end },
      expect.objectContaining({ uid: 1388803, availability: "Available" }),
      ["photos/1388803/3010129.jpg"],
    );
    expect(end).toHaveBeenCalledOnce();
  });

  it("warns about anything on the page we did not anticipate", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch(SURPRISING);

    await handler(event(42));

    expect(warn).toHaveBeenCalledWith("uid 42: unrecognized section(s): Pickleball Amenities");
    expect(warn).toHaveBeenCalledWith("uid 42: no availability found");
  });

  it("releases the connection even when the listing fails", async () => {
    stubFetch("", false);

    await expect(handler(event(1388803))).rejects.toThrow("Detail fetch failed: 503");
    expect(end).toHaveBeenCalledOnce();
  });

  it("rejects a message body that is not a uid", async () => {
    stubFetch(FIXTURE);
    const malformed = {
      Records: [{ messageId: "msg-bad", body: "{}" }],
    } as unknown as SQSEvent;

    await expect(handler(malformed)).rejects.toThrow('Expected {"uid": <integer>} in msg-bad');
  });

  it("refuses to run before it has a bucket to upload to", async () => {
    process.env.IMAGES_BUCKET_NAME = "";

    await expect(handler(event(1388803))).rejects.toThrow("IMAGES_BUCKET_NAME is not set");
    expect(getClient).not.toHaveBeenCalled();
  });
});

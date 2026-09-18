import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SQSEvent } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIXTURE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../fixtures/legacy-listing-1388803.html"),
  "utf-8",
);

const { puts, storePhotos } = vi.hoisted(() => ({
  puts: [] as Record<string, unknown>[],
  storePhotos: vi.fn(async () => ["photos/1388803/3010129.jpg"]),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = async (command: { input: Record<string, unknown> }) => {
      puts.push(command.input);
      return {};
    };
  },
  PutObjectCommand: class {
    constructor(public input: Record<string, unknown>) {}
  },
}));
vi.mock("./photo-store.js", () => ({ storePhotos }));

const { handler } = await import("./scrape-details.js");

// a heading we have never seen, and no availability line
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
      headers: new Headers({ server: "test" }),
      text: async () => html,
    })),
  );
}

beforeEach(() => {
  process.env.BUCKET_NAME = "data";
  process.env.IMAGES_BUCKET_NAME = "images";
  delete process.env.DETAILS_PREFIX;
  puts.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.stubGlobal("setTimeout", (fn: () => void) => fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("scrape-details handler", () => {
  it("uploads the photos, then leaves the details JSON in the bucket", async () => {
    stubFetch(FIXTURE);

    expect(await handler(event(1388803))).toEqual({ scraped: 1 });

    expect(storePhotos).toHaveBeenCalledWith(expect.anything(), "images", 1388803, [
      "https://www.myhousingsearch.com/WebFile?id=3010129",
      "https://www.myhousingsearch.com/WebFile?id=3010132",
    ]);

    expect(puts).toHaveLength(1);
    expect(puts[0]).toMatchObject({
      Bucket: "data",
      Key: "details/1388803.json",
      ContentType: "application/json",
    });
    expect(JSON.parse(puts[0].Body as string)).toMatchObject({
      photoKeys: ["photos/1388803/3010129.jpg"],
      details: { uid: 1388803, availability: "Available" },
    });
  });

  it("honors a prefix override", async () => {
    process.env.DETAILS_PREFIX = "elsewhere/";
    stubFetch(FIXTURE);

    await handler(event(1388803));

    expect(puts[0].Key).toBe("elsewhere/1388803.json");
  });

  it("warns about anything on the page we did not anticipate", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch(SURPRISING);

    await handler(event(42));

    expect(warn).toHaveBeenCalledWith("uid 42: unrecognized section(s): Pickleball Amenities");
    expect(warn).toHaveBeenCalledWith("uid 42: no availability found");
  });

  it("writes nothing when the origin refuses the page", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch("", false);

    await expect(handler(event(1388803))).rejects.toThrow("Detail fetch failed: 503");
    expect(puts).toEqual([]);
    expect(warn).toHaveBeenCalledWith('uid 1388803: 503 {"server":"test"}');
  });

  it("reports the underlying error, not just 'fetch failed'", async () => {
    const cause = Object.assign(new Error("connect ETIMEDOUT 10.143.32.9:443"), {
      code: "ETIMEDOUT",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed", { cause });
      }),
    );
    await expect(handler(event(1388803))).rejects.toThrow(
      "TypeError: fetch failed <- Error(ETIMEDOUT): connect ETIMEDOUT 10.143.32.9:443",
    );
  });

  it("rejects a message body that is not a uid", async () => {
    stubFetch(FIXTURE);
    const malformed = {
      Records: [{ messageId: "msg-bad", body: "{}" }],
    } as unknown as SQSEvent;

    await expect(handler(malformed)).rejects.toThrow('Expected {"uid": <integer>} in msg-bad');
  });

  it("refuses to run before it knows where to put anything", async () => {
    process.env.IMAGES_BUCKET_NAME = "";
    stubFetch(FIXTURE);

    await expect(handler(event(1388803))).rejects.toThrow("IMAGES_BUCKET_NAME is not set");
    expect(puts).toEqual([]);
  });
});

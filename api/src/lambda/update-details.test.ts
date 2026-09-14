import type { S3Event } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { end, getClient, writeListingDetails, stored } = vi.hoisted(() => {
  const end = vi.fn(async () => {});
  return {
    end,
    getClient: vi.fn(async () => ({ end })),
    writeListingDetails: vi.fn(async () => {}),
    stored: { body: null as string | null, gets: [] as Record<string, unknown>[] },
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = async (command: { input: Record<string, unknown> }) => {
      stored.gets.push(command.input);
      return {
        Body: stored.body === null ? undefined : { transformToString: async () => stored.body },
      };
    };
  },
  GetObjectCommand: class {
    constructor(public input: Record<string, unknown>) {}
  },
}));
vi.mock("./db.js", () => ({ getClient }));
vi.mock("./write-details.js", () => ({ writeListingDetails }));

const { handler } = await import("./update-details.js");

function event(...keys: string[]): S3Event {
  return { Records: keys.map((key) => ({ s3: { object: { key } } })) } as unknown as S3Event;
}

function payload(uid: number) {
  return JSON.stringify({ details: { uid }, photoKeys: [`photos/${uid}/1.jpg`] });
}

beforeEach(() => {
  process.env.BUCKET_NAME = "data";
  stored.body = payload(1388803);
  stored.gets.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("update-details handler", () => {
  it("reads the JSON and hands it to the database writer", async () => {
    const result = await handler(event("details/1388803.json"));

    expect(stored.gets[0]).toEqual({ Bucket: "data", Key: "details/1388803.json" });
    expect(writeListingDetails).toHaveBeenCalledWith({ end }, { uid: 1388803 }, [
      "photos/1388803/1.jpg",
    ]);
    expect(JSON.parse(result.body)).toEqual({ success: true, written: 1 });
    expect(end).toHaveBeenCalledOnce();
  });

  it("decodes keys that arrived url-encoded", async () => {
    await handler(event("details%2F1388803.json"));

    expect(stored.gets[0].Key).toBe("details/1388803.json");
  });

  it("releases the connection when a record fails", async () => {
    stored.body = null;

    await expect(handler(event("details/1388803.json"))).rejects.toThrow(
      "Empty body for details/1388803.json",
    );
    expect(end).toHaveBeenCalledOnce();
  });

  it("does not connect when there is nothing to do", async () => {
    expect(JSON.parse((await handler(event())).body)).toMatchObject({ success: true });
    expect(getClient).not.toHaveBeenCalled();
  });

  it("throws when BUCKET_NAME is unset", async () => {
    delete process.env.BUCKET_NAME;

    await expect(handler(event("details/1388803.json"))).rejects.toThrow("BUCKET_NAME is not set");
  });
});

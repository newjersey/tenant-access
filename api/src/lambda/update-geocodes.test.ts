import type { S3Event } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { end, getClient, writeGeocodes, objects, gets } = vi.hoisted(() => {
  const end = vi.fn(async () => {});
  return {
    end,
    getClient: vi.fn(async () => ({ end })),
    writeGeocodes: vi.fn(async (_client: unknown, geocodes: unknown[]) => geocodes.length),
    objects: new Map<string, string>(),
    gets: [] as Record<string, unknown>[],
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = async (command: { input: { Key: string } }) => {
      gets.push(command.input);
      const body = objects.get(command.input.Key);
      return { Body: body === undefined ? undefined : { transformToString: async () => body } };
    };
  },
  GetObjectCommand: class {
    constructor(public input: Record<string, unknown>) {}
  },
}));
vi.mock("./db.js", () => ({ getClient }));
vi.mock("./write-geocodes.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./write-geocodes.js")>()),
  writeGeocodes,
}));

const { handler } = await import("./update-geocodes.js");

const EXACT = { uid: 1, match: "exact", latitude: 40.22, longitude: -74.76 };
const NO_MATCH = { uid: 2, match: "no_match", latitude: null, longitude: null };

function stage(key: string, body: unknown) {
  objects.set(key, JSON.stringify(body));
  return key;
}

function event(...keys: string[]): S3Event {
  return { Records: keys.map((key) => ({ s3: { object: { key } } })) } as unknown as S3Event;
}

beforeEach(() => {
  process.env.BUCKET_NAME = "data";
  objects.clear();
  gets.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("update-geocodes handler", () => {
  it("reads the JSON and hands the geocodes to the database writer", async () => {
    const result = await handler(event(stage("geocode/all.json", [EXACT, NO_MATCH])));

    expect(gets[0]).toEqual({ Bucket: "data", Key: "geocode/all.json" });
    expect(writeGeocodes).toHaveBeenCalledWith({ end }, [EXACT, NO_MATCH]);
    expect(JSON.parse(result.body)).toEqual({ success: true, written: 2 });
    expect(console.warn).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledOnce();
  });

  it("totals the writes across records on one connection", async () => {
    const result = await handler(
      event(stage("geocode/a.json", [EXACT]), stage("geocode/b.json", [EXACT, NO_MATCH])),
    );

    expect(JSON.parse(result.body)).toEqual({ success: true, written: 3 });
    expect(getClient).toHaveBeenCalledOnce();
  });

  it("warns about uids that had no listings row", async () => {
    writeGeocodes.mockResolvedValueOnce(1);

    const result = await handler(event(stage("geocode/all.json", [EXACT, NO_MATCH])));

    expect(JSON.parse(result.body)).toEqual({ success: true, written: 1 });
    expect(console.warn).toHaveBeenCalledWith("geocode/all.json: 1 uid(s) had no listings row");
  });

  it("decodes keys that arrived url-encoded", async () => {
    stage("geocode/all 2026.json", [EXACT]);

    await handler(event("geocode%2Fall+2026.json"));

    expect(gets[0].Key).toBe("geocode/all 2026.json");
  });

  it("writes nothing from an invalid file", async () => {
    await expect(handler(event(stage("geocode/x.json", { uid: 1 })))).rejects.toThrow(
      "Expected a JSON array in geocode/x.json",
    );
    expect(writeGeocodes).not.toHaveBeenCalled();
  });

  it("releases the connection when a record fails", async () => {
    await expect(handler(event("geocode/missing.json"))).rejects.toThrow(
      "Empty body for geocode/missing.json",
    );
    expect(end).toHaveBeenCalledOnce();
  });

  it("does not connect when there is nothing to do", async () => {
    expect(JSON.parse((await handler(event())).body)).toMatchObject({ success: true });
    expect(getClient).not.toHaveBeenCalled();
  });

  it("throws when BUCKET_NAME is unset", async () => {
    delete process.env.BUCKET_NAME;

    await expect(handler(event("geocode/all.json"))).rejects.toThrow("BUCKET_NAME is not set");
  });
});

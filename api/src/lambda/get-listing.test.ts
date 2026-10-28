import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, getPoolMock } = vi.hoisted(() => {
  const queryMock = vi.fn();
  return { queryMock, getPoolMock: vi.fn(async () => ({ query: queryMock })) };
});

vi.mock("./db.js", () => ({ getPool: getPoolMock }));

const ALLOWED_ORIGIN = "http://localhost:5173";

let handler: typeof import("./get-listing.js").handler;

const makeEvent = (uid?: string, headers: Record<string, string | undefined> = {}) =>
  ({
    pathParameters: uid === undefined ? null : { uid },
    headers,
  }) as unknown as APIGatewayProxyEvent;

const invoke = async (...args: Parameters<typeof makeEvent>) =>
  (await handler(makeEvent(...args))) as APIGatewayProxyResult;

describe("get-listing handler", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("ALLOWED_ORIGINS", ALLOWED_ORIGIN);
    vi.spyOn(console, "error").mockImplementation(() => {});

    queryMock.mockResolvedValue({ rows: [{ uid: 123 }] });

    vi.resetModules();
    ({ handler } = await import("./get-listing.js"));
  });

  it("returns the listing", async () => {
    const result = await invoke("123", { origin: ALLOWED_ORIGIN });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ success: true, listing: { uid: 123 } });
    expect(result.headers).toMatchObject({
      "Cache-Control": "public, max-age=300",
      Vary: "Origin",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    });
  });

  it("looks up the uid as a number, among public listings only", async () => {
    await invoke("123");

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("shown_to_public");
    expect(params).toEqual([123]);
  });

  it("returns an uncached 404 when no public listing matches", async () => {
    queryMock.mockResolvedValue({ rows: [] });

    const result = await invoke("123");

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body as string)).toEqual({
      success: false,
      error: "Listing not found",
    });
    // a hidden listing may come back, so a 404 must not stick in any cache
    expect(result.headers?.["Cache-Control"]).toBe("no-store");
  });

  it.each([
    ["missing", undefined],
    ["non-numeric", "abc"],
    ["negative", "-5"],
    ["decimal", "1.5"],
    ["too large for INTEGER", "9999999999"],
  ])("returns 404 without querying for a %s uid", async (_label, uid) => {
    const result = await invoke(uid);

    expect(result.statusCode).toBe(404);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("returns a generic 500 without leaking the database error", async () => {
    queryMock.mockRejectedValue(new Error("password authentication failed for user tenantadmin"));

    const result = await invoke("123");

    expect(result.statusCode).toBe(500);
    expect(result.body).not.toContain("password");
    expect(JSON.parse(result.body as string)).toEqual({
      success: false,
      error: "Unable to load listing",
    });
    expect(result.headers?.["Cache-Control"]).toBe("no-store");
  });
});

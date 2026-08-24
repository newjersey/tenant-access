import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, getPoolMock } = vi.hoisted(() => {
  const queryMock = vi.fn();
  return { queryMock, getPoolMock: vi.fn(async () => ({ query: queryMock })) };
});

vi.mock("./db.js", () => ({ getPool: getPoolMock }));

const SECRET = "test-origin-secret";
const ALLOWED_ORIGIN = "http://localhost:5173";

// ALLOWED_ORIGINS is read once at module load, so the env has to be set before the import.
let handler: typeof import("./search-listings.js").handler;

const makeEvent = (
  queryStringParameters?: Record<string, string>,
  headers: Record<string, string | undefined> = { "x-origin-secret": SECRET },
) => ({ queryStringParameters, headers }) as APIGatewayProxyEventV2;

const invoke = async (...args: Parameters<typeof makeEvent>) =>
  (await handler(makeEvent(...args))) as APIGatewayProxyStructuredResultV2;

describe("search-listings handler", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("ORIGIN_SECRET", SECRET);
    vi.stubEnv("ALLOWED_ORIGINS", ALLOWED_ORIGIN);
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Both queries share one mock, so branch on the SQL rather than on call order.
    queryMock.mockImplementation(async (sql: string) =>
      sql.includes("COUNT(*)") ? { rows: [{ total: "42" }] } : { rows: [{ uid: "listing-1" }] },
    );

    vi.resetModules();
    ({ handler } = await import("./search-listings.js"));
  });

  it("returns listings and pagination", async () => {
    const result = await invoke();

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({
      success: true,
      listings: [{ uid: "listing-1" }],
      pagination: { page: 1, pageSize: 20, total: 42 },
    });
    expect(result.headers).toMatchObject({
      "Cache-Control": "public, max-age=300",
      Vary: "Origin",
    });
  });

  it("passes the trimmed location and the page offset to the queries", async () => {
    await invoke({ location: "  Newark  ", page: "3" });

    const [resultsSql, resultsParams] = queryMock.mock.calls.find(
      ([sql]) => !sql.includes("COUNT(*)"),
    ) as [string, unknown[]];
    expect(resultsSql).toContain("shown_to_public");
    expect(resultsParams).toEqual(["Newark", 20, 40]);

    const [, countParams] = queryMock.mock.calls.find(([sql]) => sql.includes("COUNT(*)")) as [
      string,
      unknown[],
    ];
    expect(countParams).toEqual(["Newark"]);
  });

  it("treats a blank location as no filter", async () => {
    await invoke({ location: "   " });

    expect(queryMock).toHaveBeenCalledWith(expect.any(String), [null, 20, 0]);
  });

  it("reflects an allowlisted origin and ignores an unknown one", async () => {
    const allowed = await invoke(undefined, {
      "x-origin-secret": SECRET,
      origin: ALLOWED_ORIGIN,
    });
    expect(allowed.headers?.["Access-Control-Allow-Origin"]).toBe(ALLOWED_ORIGIN);

    const unknown = await invoke(undefined, {
      "x-origin-secret": SECRET,
      origin: "https://badtown.example.com",
    });
    expect(unknown.headers?.["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(unknown.headers?.Vary).toBe("Origin");
  });

  it("rejects a request that did not come through CloudFront", async () => {
    const result = await invoke(undefined, {});

    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body as string)).toEqual({ success: false, error: "Forbidden" });
    expect(getPoolMock).not.toHaveBeenCalled();
  });

  it("returns a generic 500 without leaking the database error for password failure", async () => {
    queryMock.mockRejectedValue(new Error("password authentication failed for user tenantadmin"));

    const result = await invoke();

    expect(result.statusCode).toBe(500);
    expect(result.body).not.toContain("password");
    expect(JSON.parse(result.body as string)).toEqual({
      success: false,
      error: "Unable to search listings",
    });
    expect(result.headers?.["Cache-Control"]).toBe("no-store");
  });
});

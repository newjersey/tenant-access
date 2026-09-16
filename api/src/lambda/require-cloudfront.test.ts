import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isFromCloudFront } from "./require-cloudfront.js";

const SECRET = "test-origin-secret";

const eventWithHeaders = (headers: Record<string, string | undefined>) =>
  ({ headers }) as APIGatewayProxyEventV2;

describe("isFromCloudFront", () => {
  beforeEach(() => {
    vi.stubEnv("ORIGIN_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a request carrying the matching secret header", () => {
    expect(isFromCloudFront(eventWithHeaders({ "x-origin-secret": SECRET }))).toBe(true);
  });

  it("rejects a request with no secret header", () => {
    expect(isFromCloudFront(eventWithHeaders({}))).toBe(false);
  });

  it("rejects a request carrying the wrong secret", () => {
    expect(isFromCloudFront(eventWithHeaders({ "x-origin-secret": "nope" }))).toBe(false);
  });

  it("rejects an event with no headers at all", () => {
    expect(isFromCloudFront({} as APIGatewayProxyEventV2)).toBe(false);
  });

  it("fails closed when ORIGIN_SECRET is not configured", () => {
    vi.stubEnv("ORIGIN_SECRET", "");
    expect(isFromCloudFront(eventWithHeaders({ "x-origin-secret": SECRET }))).toBe(false);
  });
});

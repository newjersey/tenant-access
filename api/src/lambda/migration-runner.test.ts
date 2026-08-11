import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "./migration-runner.js";

const { sendMock, connectMock, queryMock, endMock, clientConfigMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  connectMock: vi.fn(),
  queryMock: vi.fn(),
  endMock: vi.fn(),
  clientConfigMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: class {
    send = sendMock;
  },
  GetSecretValueCommand: class {},
}));

vi.mock("pg", () => ({
  Client: class {
    connect = connectMock;
    query = queryMock;
    end = endMock;
    constructor(config: unknown) {
      clientConfigMock(config);
    }
  },
}));

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
}));

const readFileSyncMock = vi.mocked(readFileSync);

describe("migration-runner handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silence the handler's logging so test output stays clean.
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    process.env.DB_HOST = "db.example.com";
    process.env.DB_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:123:secret:db";

    // Happy-path defaults; individual tests override as needed.
    sendMock.mockResolvedValue({
      SecretString: JSON.stringify({ username: "tenantadmin", password: "s3cret" }),
    });
    connectMock.mockResolvedValue(undefined);
    queryMock.mockResolvedValue({ rowCount: 0 });
    endMock.mockResolvedValue(undefined);
    readFileSyncMock.mockReturnValue("CREATE TABLE listings ();");
  });

  it("runs the migration and returns a 200 success payload", async () => {
    const result = await handler({ migrationFile: "20260804110544_create_listings_table.sql" });

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        migration: "20260804110544_create_listings_table.sql",
        message: "Migration completed successfully",
      }),
    });

    expect(connectMock).toHaveBeenCalledOnce();
    expect(endMock).toHaveBeenCalledOnce();
  });

  it("returns a 500 when the secret has no SecretString", async () => {
    sendMock.mockResolvedValue({ SecretString: undefined });

    const result = await handler({ migrationFile: "m.sql" });

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      success: false,
      error: "DB secret has no SecretString value",
    });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("stringifies non-Error throwables in the failure payload", async () => {
    connectMock.mockRejectedValue("connection dropped");

    const result = await handler({ migrationFile: "m.sql" });

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      success: false,
      error: "connection dropped",
    });
  });
});

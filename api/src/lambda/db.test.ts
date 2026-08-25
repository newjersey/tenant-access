import { beforeEach, describe, expect, it, vi } from "vitest";

let getClient: typeof import("./db.js").getClient;

const { sendMock, connectMock, queryMock, endMock, clientConfigMock, poolConfigMock, poolOnMock } =
  vi.hoisted(() => ({
    sendMock: vi.fn(),
    connectMock: vi.fn(),
    queryMock: vi.fn(),
    endMock: vi.fn(),
    clientConfigMock: vi.fn(),
    poolConfigMock: vi.fn(),
    poolOnMock: vi.fn(),
  }));

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: class {
    send = sendMock;
  },
  GetSecretValueCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
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
  Pool: class {
    on = poolOnMock;
    constructor(config: unknown) {
      poolConfigMock(config);
    }
  },
}));

describe("getClient", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    ({ getClient } = await import("./db.js"));

    process.env.DB_HOST = "db.example.com";
    process.env.DB_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:123:secret:db";

    sendMock.mockResolvedValue({
      SecretString: JSON.stringify({ username: "tenantadmin", password: "s3cret" }),
    });
    connectMock.mockResolvedValue(undefined);
  });

  it("connects and returns the client", async () => {
    const client = await getClient();

    expect(connectMock).toHaveBeenCalledOnce();
    // Returned object is the pg Client instance (has query/end).
    expect(client).toHaveProperty("query");
    expect(client).toHaveProperty("end");
  });

  it("requests the secret named by DB_SECRET_ARN", async () => {
    await getClient();

    expect(sendMock).toHaveBeenCalledOnce();
    const command = sendMock.mock.calls[0][0];
    expect(command.input).toEqual({
      SecretId: "arn:aws:secretsmanager:us-east-1:123:secret:db",
    });
  });

  it("builds the pg client from env + secret credentials, with SSL", async () => {
    await getClient();

    expect(clientConfigMock).toHaveBeenCalledWith({
      host: "db.example.com",
      port: 5432,
      database: "tenantaccess",
      user: "tenantadmin",
      password: "s3cret",
      ssl: { rejectUnauthorized: false },
    });
  });

  it("throws when the secret has no SecretString", async () => {
    sendMock.mockResolvedValue({ SecretString: undefined });

    await expect(getClient()).rejects.toThrow("DB secret has no SecretString value");
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("reuses cached credentials across calls", async () => {
    await getClient();
    await getClient();

    expect(sendMock).toHaveBeenCalledOnce();
    expect(connectMock).toHaveBeenCalledTimes(2);
  });

  it("refetches credentials after a failed lookup", async () => {
    sendMock.mockResolvedValueOnce({ SecretString: undefined });

    await expect(getClient()).rejects.toThrow("DB secret has no SecretString value");

    // The cache was cleared, so the next call retries instead of replaying the failure.
    await expect(getClient()).resolves.toHaveProperty("query");
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});

describe("getPool", () => {
  let getPool: typeof import("./db.js").getPool;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    ({ getPool } = await import("./db.js"));

    process.env.DB_HOST = "db.example.com";
    process.env.DB_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:123:secret:db";

    sendMock.mockResolvedValue({
      SecretString: JSON.stringify({ username: "tenantadmin", password: "s3cret" }),
    });
  });

  it("builds the pool from env + secret credentials, with lambda-friendly limits", async () => {
    await getPool();

    expect(poolConfigMock).toHaveBeenCalledWith({
      host: "db.example.com",
      port: 5432,
      database: "tenantaccess",
      user: "tenantadmin",
      password: "s3cret",
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 0,
      connectionTimeoutMillis: 5000,
    });
  });

  it("reuses the pool across calls without refetching credentials", async () => {
    const first = await getPool();
    const second = await getPool();

    expect(second).toBe(first);
    expect(poolConfigMock).toHaveBeenCalledOnce();
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it("logs idle client errors rather than crashing the container", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await getPool();

    const [event, handler] = poolOnMock.mock.calls[0];
    expect(event).toBe("error");

    handler(new Error("connection terminated unexpectedly"));
    expect(errorSpy).toHaveBeenCalledWith("Idle client error:", expect.any(Error));
  });
});

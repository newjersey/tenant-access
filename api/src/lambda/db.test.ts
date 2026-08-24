import { beforeEach, describe, expect, it, vi } from "vitest";
let getClient: typeof import("./db.js").getClient;

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
});

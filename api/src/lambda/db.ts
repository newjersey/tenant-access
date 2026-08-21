import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Client, Pool } from "pg";

type DbCredentials = { username: string; password: string };

let cachedCredentials: Promise<DbCredentials> | undefined;
let pool: Pool | undefined;

const secretsClient = new SecretsManagerClient();

function connectionConfig(credentials: DbCredentials) {
  return {
    host: process.env.DB_HOST,
    port: 5432,
    database: "tenantaccess",
    user: credentials.username,
    password: credentials.password,
    ssl: { rejectUnauthorized: false }, // TODO when going to prod
  };
}

function getCredentials(): Promise<DbCredentials> {
  if (!cachedCredentials) {
    cachedCredentials = (async () => {
      const response = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }),
      );
      if (!response.SecretString) {
        throw new Error("DB secret has no SecretString value");
      }
      return JSON.parse(response.SecretString);
    })().catch((error) => {
      cachedCredentials = undefined;
      throw error;
    });
  }
  return cachedCredentials;
}

export async function getClient(): Promise<Client> {
  const client = new Client(connectionConfig(await getCredentials()));
  await client.connect();
  return client;
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  pool = new Pool({
    ...connectionConfig(await getCredentials()),
    max: 2,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 5000,
  });

  pool.on("error", (error) => console.error("Idle client error:", error));

  return pool;
}

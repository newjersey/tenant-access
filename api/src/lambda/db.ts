import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Client } from "pg";

const secretsClient = new SecretsManagerClient();

export async function getClient(): Promise<Client> {
  const secretResponse = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }),
  );

  if (!secretResponse.SecretString) {
    throw new Error("DB secret has no SecretString value");
  }

  const credentials: { username: string; password: string } = JSON.parse(
    secretResponse.SecretString,
  );

  const client = new Client({
    host: process.env.DB_HOST,
    port: 5432,
    database: "tenantaccess",
    user: credentials.username,
    password: credentials.password,
    ssl: { rejectUnauthorized: false }, // TODO when going to prod
  });

  await client.connect();
  return client;
}

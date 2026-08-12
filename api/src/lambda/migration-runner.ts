import { readFileSync } from "node:fs";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Client } from "pg";

const secretsClient = new SecretsManagerClient();

interface Event {
  migrationFile: string; // e.g., "20260804143022_add_column.sql"
}

export const handler = async (event: Event) => {
  console.log("Migration request:", event);

  try {
    // Get DB credentials
    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }),
    );

    if (!secretResponse.SecretString) {
      throw new Error("DB secret has no SecretString value");
    }

    const credentials = JSON.parse(secretResponse.SecretString);

    // Connect to database
    const client = new Client({
      host: process.env.DB_HOST,
      port: 5432,
      database: "tenantaccess",
      user: credentials.username,
      password: credentials.password,
      ssl: { rejectUnauthorized: false }, // TODO when going to prod
    });

    await client.connect();
    console.log("Connected to database");

    // Read migration file (bundled with Lambda)
    const migrationPath = `/var/task/migrations/${event.migrationFile}`;
    console.log(`Reading: ${migrationPath}`);
    const sql = readFileSync(migrationPath, "utf-8");

    // Execute SQL
    console.log(`Executing migration: ${event.migrationFile}`);
    await client.query(sql);
    console.log("Migration successful");

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        migration: event.migrationFile,
        message: "Migration completed successfully",
      }),
    };
  } catch (error) {
    console.error("Migration failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};

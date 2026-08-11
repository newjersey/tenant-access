import { readFileSync } from "node:fs";
import { getClient } from "./db.js";

interface Event {
  migrationFile: string; // e.g., "20260804143022_add_column.sql"
}

export const handler = async (event: Event) => {
  console.log("Migration request:", event);

  try {
    // Connect to database
    const client = await getClient();
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

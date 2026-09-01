import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { TEST_DB } from "./support.js";

const MIGRATIONS_DIR = join(import.meta.dirname, "../../migrations");

async function connect(attempts = 30): Promise<Client> {
  for (let attempt = 1; ; attempt++) {
    const client = new Client(TEST_DB);
    try {
      await client.connect();
      return client;
    } catch (error) {
      await client.end().catch(() => {});
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

export async function setup() {
  const client = await connect();
  try {
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public");

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((name) => name.endsWith(".sql"))
      .sort();

    for (const file of files) {
      await client.query(readFileSync(join(MIGRATIONS_DIR, file), "utf-8"));
    }
  } finally {
    await client.end();
  }
}

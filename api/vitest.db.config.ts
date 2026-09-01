import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vitest/config";

// Anything that deals with Postgres, whether through importing from db.ts or by importing from pg
const TOUCHES_POSTGRES = /from ["'][^"']*db\.js["']|from ["']pg["']/;

// deliberate exemptions from the above pattern that definitely don't need DB testing
const EXEMPT = new Set(["src/lambda/db.ts", "src/lambda/migration-runner.ts"]);

const postgresFiles = readdirSync("src", { recursive: true, encoding: "utf8" })
  .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
  .map((name) => join("src", name))
  .filter((path) => !EXEMPT.has(path))
  .filter((path) => TOUCHES_POSTGRES.test(readFileSync(path, "utf8")));

if (postgresFiles.length === 0) {
  throw new Error("No files talk to Postgres -- something broke the DB test coverage");
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/db/**/*.test.ts"],
    globalSetup: ["./test/db/global-setup.ts"],
    setupFiles: ["./test/db/setup-env.ts"],
    fileParallelism: false,
    silent: "passed-only",
    testTimeout: 30_000,
    hookTimeout: 60_000,
    coverage: {
      provider: "v8",
      include: postgresFiles,
      reporter: ["text"],
      reportsDirectory: "coverage/db",
      thresholds: { perFile: true, lines: 100 },
    },
  },
});

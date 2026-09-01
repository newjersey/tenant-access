import { defineConfig } from "vitest/config";

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
      // Only the files with SQL syntax
      include: [
        "src/lambda/query-listings.ts",
        "src/lambda/search-listings.ts",
        "src/lambda/update-listings.ts",
      ],
      reporter: ["text"],
      reportsDirectory: "coverage/db",
      thresholds: { perFile: true, lines: 100 },
    },
  },
});

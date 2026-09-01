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
  },
});

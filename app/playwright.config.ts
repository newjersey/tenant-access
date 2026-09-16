import { defineConfig } from "@playwright/test";

const API_BASE_URL = "https://api.e2e.test";

const PORT = 4174;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: BASE_URL },
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    env: { VITE_API_BASE_URL: API_BASE_URL },
    timeout: 120_000,
  },
});

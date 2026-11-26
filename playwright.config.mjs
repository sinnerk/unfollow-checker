import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "tests/ui",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8765",
    locale: "en-US",
  },
  webServer: {
    command: "python -m http.server 8765 --directory docs",
    url: "http://127.0.0.1:8765/index.html",
    reuseExistingServer: true,
    timeout: 15_000,
  },
});

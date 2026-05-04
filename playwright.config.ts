import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  outputDir: "test-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }]
  ],
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3101",
    env: {
      NASA_API_KEY: "DEMO_KEY",
      SPACE_API_MODE: "mock"
    },
    url: "http://127.0.0.1:3101/api/auth/me",
    reuseExistingServer: false,
    timeout: 120_000
  }
});

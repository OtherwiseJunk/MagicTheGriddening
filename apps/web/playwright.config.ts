import { defineConfig } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: process.env.CI ? { channel: "chrome" } : {},
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5433/griddening_e2e",
      OVERRIDE_DATE: process.env.OVERRIDE_DATE || "20260101",
      BULK_DATA_DIR: path.join(__dirname, "e2e"),
    },
  },
});

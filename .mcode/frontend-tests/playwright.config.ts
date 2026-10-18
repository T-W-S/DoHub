import { defineConfig, devices } from "@playwright/test";
import path from "path";

const storageStatePath = path.join(__dirname, "storageState.json");

export default defineConfig({
  testDir: ".",
  timeout: 30000,
  retries: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "on",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: storageStatePath,
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: `${process.env.MCODE_DIR}/fe_testing/playwright-results.json`,
      },
    ],
  ],
});

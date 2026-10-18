import { test as setup, expect } from "@playwright/test";
import path from "path";

const storageStatePath = path.join(__dirname, "storageState.json");

// Credentials from QA report — the seeded admin account for this sandbox
const ADMIN_EMAIL = "admin@dohub.test";
const ADMIN_PASSWORD = "Admin1234!";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/");

  // Confirm login page loaded — QA report: h3 "Docker Hub"
  await expect(page.getByRole("heading", { level: 3, name: "Docker Hub" })).toBeVisible();

  // Fill credentials using fill() which fires proper React input events in Playwright
  await page.getByRole("textbox", { name: /email/i }).fill(ADMIN_EMAIL);
  await page.getByRole("textbox", { name: /password/i }).fill(ADMIN_PASSWORD);

  // Click Sign In
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for dashboard redirect — confirms successful auth
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // Save authenticated session state for all subsequent tests
  await page.context().storageState({ path: storageStatePath });
});

import { test, expect } from "@playwright/test";

// These tests run WITHOUT auth — testing public redirect behavior
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Setup page redirect", () => {
  test("redirects /setup to / when admin already exists", async ({ page }) => {
    // QA report: "Guard: When admin exists, /setup immediately 302-redirects to /"
    // The sandbox already has an admin account (admin@dohub.test), so /setup should redirect
    await page.goto("/setup");
    await page.waitForLoadState("networkidle");

    // Should land on the login page, NOT the setup page
    await expect(page).toHaveURL(/localhost:3000\//);
    await expect(page.getByRole("heading", { level: 3, name: "Docker Hub" })).toBeVisible();
    // Setup heading must NOT be present
    await expect(page.getByRole("heading", { name: /first.run setup/i })).not.toBeVisible();
  });
});

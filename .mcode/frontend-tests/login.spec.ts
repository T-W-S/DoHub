import { test, expect } from "@playwright/test";

// These tests run WITHOUT an authenticated session — they test the public login page.
// Override the storageState from the project config.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the page to be ready
    await page.waitForLoadState("networkidle");
  });

  test("displays the Docker Hub heading", async ({ page }) => {
    // QA report: h3 text "Docker Hub" confirms login page loaded (not dashboard)
    await expect(page.getByRole("heading", { level: 3, name: "Docker Hub" })).toBeVisible();
  });

  test("displays the Email input field", async ({ page }) => {
    // QA report: textbox "Email", placeholder "admin@example.com", required
    const emailInput = page.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible();
  });

  test("displays the Password input field", async ({ page }) => {
    // QA report: textbox "Password", placeholder "Enter your password", has lock icon
    const passwordInput = page.getByRole("textbox", { name: /password/i });
    await expect(passwordInput).toBeVisible();
  });

  test("displays the Sign In button", async ({ page }) => {
    // QA report: button "Sign In" submits the form
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    // QA report: POST /api/auth 200, redirect to /dashboard
    await page.getByRole("textbox", { name: /email/i }).fill("admin@dohub.test");
    await page.getByRole("textbox", { name: /password/i }).fill("Admin1234!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

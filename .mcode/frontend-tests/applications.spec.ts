import { test, expect } from "@playwright/test";

test.describe("Applications page (/dashboard/applications)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/applications");
    await page.waitForLoadState("networkidle");
  });

  test("displays Applications heading", async ({ page }) => {
    // QA report: h1 text "Applications"
    await expect(page.getByRole("heading", { level: 1, name: "Applications" })).toBeVisible();
  });

  test("displays Add Application button", async ({ page }) => {
    // QA report: button "Add Application" — top-right
    await expect(page.getByRole("button", { name: /add application/i })).toBeVisible();
  });

  test("displays search textbox", async ({ page }) => {
    // QA report: textbox "Search by name, description, or tag..."
    await expect(page.getByRole("textbox", { name: /search/i })).toBeVisible();
  });

  test("displays category filter combobox", async ({ page }) => {
    // QA report: combobox with default value "All categories"
    // Two comboboxes exist (category + sort), scope to the category one
    await expect(page.getByRole("combobox").filter({ hasText: "All categories" })).toBeVisible();
  });

  test("opens Add Application dialog when button clicked", async ({ page }) => {
    // QA report: heading "Add Application" in dialog, modal layout confirmed
    await page.getByRole("button", { name: /add application/i }).click();
    await expect(page.getByRole("heading", { level: 2, name: /add application/i })).toBeVisible();
  });

  test("Add Application dialog contains Name field", async ({ page }) => {
    // QA report: textbox "Name *" — required, placeholder "My App"
    await page.getByRole("button", { name: /add application/i }).click();
    await expect(page.getByRole("textbox", { name: /name/i })).toBeVisible();
  });

  test("Add Application dialog contains Public URL field", async ({ page }) => {
    // QA report: textbox "Public URL *" — required, placeholder "https://app.example.com"
    await page.getByRole("button", { name: /add application/i }).click();
    await expect(page.getByRole("textbox", { name: /public url/i })).toBeVisible();
  });

  test("Add Application dialog contains Cancel button", async ({ page }) => {
    // QA report: button "Cancel" — type=button, closes dialog
    await page.getByRole("button", { name: /add application/i }).click();
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
  });

  test("Cancel button closes the Add Application dialog", async ({ page }) => {
    await page.getByRole("button", { name: /add application/i }).click();
    await expect(page.getByRole("heading", { level: 2, name: /add application/i })).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("heading", { level: 2, name: /add application/i })).not.toBeVisible();
  });

  test("successfully adds a new application", async ({ page }) => {
    // QA report: POST /api/applications 201, dialog closes, app card appears with "Pending" badge
    await page.getByRole("button", { name: /add application/i }).click();
    await expect(page.getByRole("heading", { level: 2, name: /add application/i })).toBeVisible();

    // Fill Name — React controlled input, Playwright fill fires proper events
    await page.getByRole("textbox", { name: /^name/i }).fill("Test App E2E");
    // Fill Public URL
    await page.getByRole("textbox", { name: /public url/i }).fill("https://example.com");

    // Submit — button may be off-screen on small viewports; use JS click per QA report
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (btn) btn.click();
    });

    // Wait for dialog to close and app to appear
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { level: 2, name: /add application/i })).not.toBeVisible();

    // App card with app name should now be visible
    // Use first() since previous test runs may have added duplicate-named apps (DB persists)
    await expect(page.getByRole("heading", { name: "Test App E2E" }).first()).toBeVisible();
  });
});

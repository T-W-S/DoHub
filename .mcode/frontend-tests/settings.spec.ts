import { test, expect } from "@playwright/test";

test.describe("Settings page (/dashboard/settings)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
  });

  test("displays Settings heading", async ({ page }) => {
    // QA report: h1 text "Settings"
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  });

  test("displays the correct subtitle (SSRF removed)", async ({ page }) => {
    // QA report (target — SSRF removed): subtitle is "Configure monitoring settings"
    // NOT "...and security settings" as in the origin app.
    // This specifically verifies the SSRF removal milestone item.
    await expect(page.getByText("Configure monitoring settings")).toBeVisible();
  });

  test("does NOT display Internal Host Allowlist section (SSRF removed)", async ({ page }) => {
    // QA report: "Internal Host Allowlist" section is present in origin but
    // intentionally removed in target per SSRF removal milestone item.
    await expect(page.getByText("Internal Host Allowlist")).not.toBeVisible();
  });

  test("displays Monitoring Configuration section", async ({ page }) => {
    // QA report: "Monitoring Configuration" section with clock icon
    await expect(page.getByText("Monitoring Configuration")).toBeVisible();
  });

  test("displays Check Interval spinbutton", async ({ page }) => {
    // QA report: spinbutton "Check Interval (seconds)" — default 300
    await expect(page.getByRole("spinbutton", { name: /check interval/i })).toBeVisible();
  });

  test("displays Check Timeout spinbutton", async ({ page }) => {
    // QA report: spinbutton "Check Timeout (ms)" — default 10000
    await expect(page.getByRole("spinbutton", { name: /check timeout/i })).toBeVisible();
  });

  test("displays Retention spinbutton", async ({ page }) => {
    // QA report: spinbutton "Retention (days)" — default 30
    await expect(page.getByRole("spinbutton", { name: /retention/i })).toBeVisible();
  });

  test("displays Save Settings button", async ({ page }) => {
    // QA report: button "Save Settings" — saves monitoring config via PUT /api/settings
    await expect(page.getByRole("button", { name: /save settings/i })).toBeVisible();
  });

  test("displays About Docker Hub section", async ({ page }) => {
    // QA report: "About Docker Hub" section visible below Save Settings
    await expect(page.getByText(/about docker hub/i)).toBeVisible();
  });

  test("Save Settings sends PUT /api/settings and shows success toast", async ({ page }) => {
    // QA report: PUT /api/settings 200, success toast "Settings saved" appears
    // The Sonner container (region "Notifications alt+T") is hidden when empty.
    // Instead, wait for the actual toast text to appear in the DOM.
    const saveButton = page.getByRole("button", { name: /save settings/i });
    await saveButton.click();
    // Wait for "Settings saved" toast text (from toast.success('Settings saved') in settings/page.tsx)
    await expect(page.getByText("Settings saved")).toBeVisible({ timeout: 5000 });
  });
});

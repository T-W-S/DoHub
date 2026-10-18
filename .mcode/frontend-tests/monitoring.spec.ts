import { test, expect } from "@playwright/test";

test.describe("Monitoring page (/dashboard/monitoring)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/monitoring");
    await page.waitForLoadState("networkidle");
  });

  test("displays Monitoring heading", async ({ page }) => {
    // QA report: h1 text "Monitoring"
    await expect(page.getByRole("heading", { level: 1, name: "Monitoring" })).toBeVisible();
  });

  test("displays Run All Checks button", async ({ page }) => {
    // QA report: button "Run All Checks" — top-right, triggers POST /api/monitoring/run-checks
    await expect(page.getByRole("button", { name: /run all checks/i })).toBeVisible();
  });

  test("displays Monitored Apps stat card", async ({ page }) => {
    // QA report: three stat cards: "Monitored Apps", "Endpoints Up", "Endpoints Down"
    await expect(page.getByText("Monitored Apps")).toBeVisible();
  });

  test("displays Endpoints Up stat card", async ({ page }) => {
    // QA report: three stat cards: "Monitored Apps", "Endpoints Up", "Endpoints Down"
    await expect(page.getByText("Endpoints Up")).toBeVisible();
  });

  test("displays Endpoints Down stat card", async ({ page }) => {
    // QA report: three stat cards: "Monitored Apps", "Endpoints Up", "Endpoints Down"
    await expect(page.getByText("Endpoints Down")).toBeVisible();
  });

  test("displays Current Status section", async ({ page }) => {
    // QA report: "Current Status" section heading + Refresh button
    await expect(page.getByText("Current Status")).toBeVisible();
  });

  test("displays Refresh button in Current Status section", async ({ page }) => {
    // QA report: button "Refresh" within the Current Status section
    await expect(page.getByRole("button", { name: /refresh/i })).toBeVisible();
  });

  test("displays Check History section", async ({ page }) => {
    // QA report: "Check History" section visible at bottom of page
    await expect(page.getByText("Check History")).toBeVisible();
  });
});

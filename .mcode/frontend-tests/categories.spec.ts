import { test, expect } from "@playwright/test";

test.describe("Categories page (/dashboard/categories)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/categories");
    await page.waitForLoadState("networkidle");
  });

  test("displays Categories heading", async ({ page }) => {
    // QA report: h1 text "Categories"
    await expect(page.getByRole("heading", { level: 1, name: "Categories" })).toBeVisible();
  });

  test("displays Add Category button", async ({ page }) => {
    // QA report: button "Add Category" — top-right
    await expect(page.getByRole("button", { name: /add category/i })).toBeVisible();
  });

  test("opens Add Category dialog when button clicked", async ({ page }) => {
    // QA report: analogous to Add Application — same React form pattern
    await page.getByRole("button", { name: /add category/i }).click();
    // The dialog heading should appear
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test.describe("Dashboard Overview (/dashboard)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("displays Overview heading", async ({ page }) => {
    // QA report: h1 text "Overview"
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  });

  test("displays the Manage Applications CTA link", async ({ page }) => {
    // QA report: "Manage Applications" — top-right CTA
    // Agent-browser confirmed this is a link element, not a button
    await expect(page.getByRole("link", { name: "Manage Applications" })).toBeVisible();
  });

  test("displays Total Applications stat card", async ({ page }) => {
    // QA report: "Total Applications" stat card with number below
    await expect(page.getByText("Total Applications")).toBeVisible();
  });

  test("displays Public Endpoints Up stat card", async ({ page }) => {
    // QA report: "Public Endpoints Up" stat card with green circle icon
    await expect(page.getByText("Public Endpoints Up")).toBeVisible();
  });

  test("displays Public Endpoints Down stat card", async ({ page }) => {
    // QA report: "Public Endpoints Down" stat card with red circle icon
    await expect(page.getByText("Public Endpoints Down")).toBeVisible();
  });

  test("displays Categories stat card", async ({ page }) => {
    // QA report: "Categories" stat card with tree icon
    // Two "Categories" texts exist (sidebar link + stat card); scope to main content
    await expect(page.getByRole("main").getByText("Categories")).toBeVisible();
  });

  test("displays Monitoring Status section", async ({ page }) => {
    // QA report: "Monitoring Status" section heading followed by Up/Down/Pending rows
    await expect(page.getByText("Monitoring Status")).toBeVisible();
  });

  test("displays Recent Applications section", async ({ page }) => {
    // QA report: "Recent Applications" section heading with "View all" link
    await expect(page.getByText("Recent Applications")).toBeVisible();
  });

  test("displays View all link in Recent Applications", async ({ page }) => {
    // QA report: link "View all" in the Recent Applications header
    await expect(page.getByRole("link", { name: /view all/i })).toBeVisible();
  });

  test("sidebar navigation is present", async ({ page }) => {
    // QA report: sidebar with Applications, Categories, Monitoring, Settings links
    // Use exact match to avoid matching "Manage Applications" link in main content
    await expect(page.getByRole("link", { name: "Applications", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Monitoring", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
  });
});

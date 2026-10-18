import { test, expect } from "@playwright/test";

// The logout test creates its own independent login session instead of using
// the shared storageState. This prevents it from destroying the token that
// all other authenticated tests depend on.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Logout flow", () => {
  test("logout from dashboard redirects to login page", async ({ page }) => {
    // Create a fresh session by logging in directly in this test
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 3, name: "Docker Hub" })).toBeVisible();

    await page.getByRole("textbox", { name: /email/i }).fill("admin@dohub.test");
    await page.getByRole("textbox", { name: /password/i }).fill("Admin1234!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // QA report: button "AD Administrator Signed in" — sidebar footer, opens dropdown
    const adminButton = page.getByRole("button", { name: /administrator/i });
    await expect(adminButton).toBeVisible();
    await adminButton.click();

    // QA report: menuitem "Sign out" — in the dropdown
    await expect(page.getByRole("menuitem", { name: /sign out/i })).toBeVisible();
    await page.getByRole("menuitem", { name: /sign out/i }).click();

    // QA report: redirect to http://localhost:3000/ (login page)
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 });
    await expect(page.getByRole("heading", { level: 3, name: "Docker Hub" })).toBeVisible();
  });
});

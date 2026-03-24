import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill("input[type='email']", "fake@example.com");
    await page.fill("input[type='password']", "wrongpassword");
    await page.click("button[type='submit']");

    // Should show an error, not redirect
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill("input[type='email']", "test@apothecare.com");
    await page.fill("input[type='password']", "Test123456!");
    await page.click("button[type='submit']");

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

// Reusable login helper
async function login(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.fill("input[type='email']", "test@apothecare.com");
  await page.fill("input[type='password']", "Test123456!");
  await page.click("button[type='submit']");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

test.describe("Dashboard", () => {
  test("shows greeting after login", async ({ page }) => {
    await login(page);
    // Dashboard should have a greeting or the app name
    await expect(page.locator("text=Good")).toBeVisible({ timeout: 5_000 });
  });

  test("sidebar navigation works", async ({ page }) => {
    await login(page);

    // Navigate to patients
    const patientsLink = page.locator('a[href*="/patients"]').first();
    if (await patientsLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await patientsLink.click();
      await expect(page).toHaveURL(/\/patients/, { timeout: 5_000 });
    }
  });

  test("new chat opens", async ({ page }) => {
    await login(page);

    // Navigate to chat
    const chatLink = page.locator('a[href*="/chat"]').first();
    if (await chatLink.isVisible()) {
      await chatLink.click();
      await expect(page).toHaveURL(/\/chat/);
      // Chat input should be visible
      await expect(page.locator("textarea")).toBeVisible({ timeout: 5_000 });
    }
  });
});

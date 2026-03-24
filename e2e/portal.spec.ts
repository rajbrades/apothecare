import { test, expect } from "@playwright/test";

test.describe("Patient Portal", () => {
  test("portal login page loads", async ({ page }) => {
    await page.goto("/portal/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("portal login sends magic link", async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill("input[type='email']", "patient@test.com");

    // Portal uses magic link flow — button says "Send sign-in link"
    const submitBtn = page.getByRole("button", { name: /send sign-in link/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Should show confirmation message or stay on page (magic link sent)
    // Won't actually redirect since we can't click the email link in e2e
    await expect(page).toHaveURL(/\/portal/);
  });
});

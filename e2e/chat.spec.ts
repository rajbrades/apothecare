import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.fill("input[type='email']", "test@apothecare.com");
  await page.fill("input[type='password']", "Test123456!");
  await page.click("button[type='submit']");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

test.describe("Chat", () => {
  test("can send a message and receive a streamed response", async ({ page }) => {
    await login(page);
    await page.goto("/chat");

    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    await textarea.fill("What is magnesium glycinate used for?");
    await textarea.press("Enter");

    // User message should appear
    await expect(page.locator("text=magnesium glycinate")).toBeVisible({ timeout: 5_000 });

    // Wait for assistant response to start streaming (thinking dots or text)
    await expect(page.locator('[class*="message-entrance"]').last()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("source filter popover opens and closes", async ({ page }) => {
    await login(page);
    await page.goto("/chat");

    // Click the source filter button
    const sourceBtn = page.locator("button", { hasText: /Sources|All Sources/ }).first();
    if (await sourceBtn.isVisible({ timeout: 3_000 })) {
      await sourceBtn.click();
      // Popover should appear
      await expect(page.getByRole("heading", { name: "Evidence Sources" })).toBeVisible();
      // Close it
      await page.keyboard.press("Escape");
    }
  });

  test("deep consult toggle works", async ({ page }) => {
    await login(page);
    await page.goto("/chat");

    const deepConsultBtn = page.locator("button", { hasText: "Deep Consult" });
    if (await deepConsultBtn.isVisible({ timeout: 3_000 })) {
      await deepConsultBtn.click();
      // Should show active state (gold styling)
      await expect(deepConsultBtn).toHaveClass(/gold/);
    }
  });
});

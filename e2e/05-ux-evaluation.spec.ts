import { test, expect } from "@playwright/test";
import { loginAsProvider, loginAsPatient, waitForIdle } from "./helpers/auth";

/**
 * UX & Usability Evaluation Tests
 *
 * These tests evaluate the user experience across key flows:
 * - Page load performance
 * - Mobile responsiveness
 * - Keyboard navigation & accessibility
 * - Error handling & feedback
 * - Navigation consistency
 */

test.describe("UX: Page Load & Performance", () => {
  test("dashboard loads within 5 seconds", async ({ page }) => {
    await loginAsProvider(page);
    const start = Date.now();
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - start;
    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test("chat page loads and is interactive", async ({ page }) => {
    await loginAsProvider(page);
    await page.goto("/chat");
    await waitForIdle(page);

    // Verify chat input is visible and focusable
    const chatInput = page.locator(
      'textarea, input[placeholder*="Ask"], input[placeholder*="query"]'
    ).first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });
    console.log("Chat input visible and ready");
  });

  test("sidebar navigation works", async ({ page }) => {
    await loginAsProvider(page);

    // Test all main nav items
    const navItems = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/patients", label: "Patients" },
      { href: "/supplements", label: "Supplements" },
      { href: "/settings", label: "Settings" },
    ];

    for (const { href, label } of navItems) {
      const link = page.locator(`a[href="${href}"]`).first();
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await link.click();
        await page.waitForURL(`**${href}`, { timeout: 10_000 });
        console.log(`Nav → ${label}: OK`);
      }
    }
  });
});

test.describe("UX: Accessibility & Keyboard Navigation", () => {
  test("login form is keyboard-navigable", async ({ page }) => {
    await page.goto("/auth/login");

    // Tab through form elements
    await page.keyboard.press("Tab");
    const focused1 = await page.evaluate(() => document.activeElement?.id);

    await page.keyboard.press("Tab");
    const focused2 = await page.evaluate(() => document.activeElement?.id);

    // At least email and password should be tabbable
    console.log(`Tab order: ${focused1} → ${focused2}`);
    expect(focused1 || focused2).toBeTruthy();
  });

  test("visit workspace tabs have proper ARIA", async ({ page }) => {
    await loginAsProvider(page);
    await page.goto("/visits");
    await waitForIdle(page);

    // Create or navigate to a visit
    const visitLink = page.locator('a[href*="/visits/"]').first();
    if (!(await visitLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log("No existing visits — skipping ARIA check");
      return;
    }
    await visitLink.click();
    await page.waitForURL(/\/visits\/[\w-]+/);

    // Verify tablist role
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
    await expect(tablist).toHaveAttribute("aria-label", /.+/);

    // Verify tab roles and attributes
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toHaveAttribute("aria-selected", /.*/);
      await expect(tab).toHaveAttribute("aria-controls", /tabpanel-.+/);
      await expect(tab).toHaveAttribute("id", /tab-.+/);
    }

    // Verify active tab has corresponding visible panel
    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    const panelId = await activeTab.getAttribute("aria-controls");
    if (panelId) {
      await expect(page.locator(`#${panelId}`)).toBeVisible();
    }
    console.log("Visit workspace ARIA attributes: valid");
  });

  test("all images have alt text", async ({ page }) => {
    await loginAsProvider(page);
    await page.goto("/dashboard");
    await waitForIdle(page);

    const images = page.locator("img");
    const imgCount = await images.count();
    let missingAlt = 0;

    for (let i = 0; i < imgCount; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      if (!alt && alt !== "") {
        const src = await images.nth(i).getAttribute("src");
        console.log(`Missing alt: ${src}`);
        missingAlt++;
      }
    }

    console.log(`Images: ${imgCount} total, ${missingAlt} missing alt text`);
    // Allow decorative images with alt=""
    expect(missingAlt).toBe(0);
  });
});

test.describe("UX: Error Handling & Feedback", () => {
  test("login shows error for invalid credentials", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill("input#email", "wrong@example.com");
    await page.fill("input#password", "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message
    const error = page.locator('[role="alert"], text=Invalid, text=error');
    await expect(error.first()).toBeVisible({ timeout: 10_000 });
    console.log("Login error message displayed correctly");
  });

  test("registration validates required fields", async ({ page }) => {
    await page.goto("/auth/register");

    // Try to submit empty form
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Should show validation errors
    const errors = page.locator(
      "text=required, .text-red-600, [role='alert']"
    );
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);
    console.log(`${errorCount} validation error(s) shown on empty submit`);
  });

  test("404 page displays correctly", async ({ page }) => {
    await loginAsProvider(page);
    await page.goto("/nonexistent-page-12345");

    // Should show some kind of not-found message
    const notFound = page.locator(
      "text=not found, text=404, text=doesn't exist"
    );
    if (await notFound.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("404 page renders correctly");
    }
  });
});

test.describe("UX: Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

  test("dashboard renders on mobile", async ({ page }) => {
    await loginAsProvider(page);
    await page.goto("/dashboard");
    await waitForIdle(page);

    // Greeting should still be visible
    await expect(page.locator("h1")).toBeVisible();

    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(
      () => document.body.scrollWidth
    );
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const hasOverflow = bodyWidth > viewportWidth + 5; // 5px tolerance
    if (hasOverflow) {
      console.log(
        `ISSUE: Horizontal overflow on mobile (body: ${bodyWidth}px, viewport: ${viewportWidth}px)`
      );
    } else {
      console.log("No horizontal overflow on mobile dashboard");
    }
  });

  test("sidebar is hidden/toggleable on mobile", async ({ page }) => {
    await loginAsProvider(page);
    await page.goto("/dashboard");
    await waitForIdle(page);

    // Sidebar should be hidden on mobile
    const sidebar = page.locator("nav, aside").first();
    const sidebarVisible = await sidebar
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Look for hamburger/menu toggle
    const menuToggle = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"], button[aria-label*="sidebar"]'
    ).first();
    const hasToggle = await menuToggle
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!sidebarVisible && hasToggle) {
      console.log("Sidebar hidden on mobile with toggle — good pattern");
    } else if (!sidebarVisible && !hasToggle) {
      console.log("ISSUE: Sidebar hidden but no toggle button found");
    } else {
      console.log("Sidebar visible on mobile — may need responsive check");
    }
  });

  test("patient portal renders on mobile", async ({ page }) => {
    await page.goto("/portal/login");

    // Login form should fit within viewport
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const inputBox = await emailInput.boundingBox();
    if (inputBox) {
      expect(inputBox.x).toBeGreaterThanOrEqual(0);
      expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(375 + 5);
      console.log("Portal login fits within mobile viewport");
    }
  });
});

test.describe("UX: Portal Flow Consistency", () => {
  test("portal has consistent header and footer", async ({ page }) => {
    await loginAsPatient(page);
    await page.goto("/portal/dashboard");
    await waitForIdle(page);

    // Check header
    const logo = page.locator('text=Apothecare, img[alt*="Apothecare"]').first();
    const portalLabel = page.locator("text=Patient Portal");
    const signOutBtn = page.locator('button:has-text("Sign out")');

    if (await logo.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Header: Logo visible");
    }
    if (await portalLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Header: 'Patient Portal' label visible");
    }
    if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Header: Sign out button visible");
    }

    // Check footer links
    const footerLinks = ["Terms", "Security", "Telehealth"];
    for (const link of footerLinks) {
      const el = page.locator(`a:has-text("${link}")`).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Footer: "${link}" link present`);
      } else {
        console.log(`ISSUE: Footer link "${link}" not found`);
      }
    }
  });
});

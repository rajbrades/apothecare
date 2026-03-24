import { type Page, expect } from "@playwright/test";

// ── Test credentials (from seed scripts) ────────────────────────────────
export const PROVIDER = {
  email: "test@apothecare.com",
  password: "Test123456!",
} as const;

export const PATIENT = {
  email: "patient@test.com",
  password: "testtest123",
  firstName: "Alex",
  lastName: "Thompson",
} as const;

// ── Site gate ───────────────────────────────────────────────────────────

/** Pass through site password gate if enabled */
export async function passSiteGate(page: Page) {
  const sitePassword = process.env.E2E_SITE_PASSWORD;
  if (!sitePassword) return;

  // If we're redirected to /gate, fill in the password
  if (page.url().includes("/gate")) {
    await page.fill('input[type="password"]', sitePassword);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/gate"));
  }
}

// ── Provider auth ───────────────────────────────────────────────────────

/** Log in as the test provider and navigate to dashboard */
export async function loginAsProvider(page: Page) {
  await page.goto("/auth/login");
  await passSiteGate(page);

  await page.fill("input#email", PROVIDER.email);
  await page.fill("input#password", PROVIDER.password);
  await page.click('button[type="submit"]');

  // Wait for dashboard or onboarding
  await page.waitForURL((url) =>
    url.pathname.includes("/dashboard") || url.pathname.includes("/onboarding")
  );
}

/** Log in as the test patient via portal login (dev password mode) */
export async function loginAsPatient(page: Page) {
  await page.goto("/portal/login");
  await passSiteGate(page);

  await page.fill('input[type="email"]', PATIENT.email);

  // Dev mode shows a password field
  const pwInput = page.locator('input[type="password"]');
  if (await pwInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pwInput.fill(PATIENT.password);
  }

  await page.click('button:has-text("Send sign-in link")');

  // In dev mode with password, should redirect to dashboard
  await page.waitForURL((url) => url.pathname.includes("/portal/"), {
    timeout: 15_000,
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Wait for navigation to settle (no pending requests) */
export async function waitForIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState("networkidle", { timeout });
}

/** Get a toast message text (sonner toasts) */
export async function getToastText(page: Page): Promise<string | null> {
  const toast = page.locator("[data-sonner-toast]").first();
  if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
    return toast.textContent();
  }
  return null;
}

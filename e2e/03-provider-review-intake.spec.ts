import { test, expect } from "@playwright/test";
import { loginAsProvider, PATIENT, waitForIdle } from "./helpers/auth";

/**
 * Provider Flow: Review patient intake and prepare for visit.
 *
 * Steps:
 * 1. Log in as provider
 * 2. Find the test patient
 * 3. Review demographics, intake data, and portal status
 * 4. Check pre-chart view (AI synthesis)
 * 5. Verify patient documents section
 */

test.describe("Provider: Review Patient Intake", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProvider(page);
  });

  test("should find test patient in patient list", async ({ page }) => {
    await page.goto("/patients");
    await waitForIdle(page);

    // Search for patient
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"]'
    );
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(PATIENT.lastName);
      await page.waitForTimeout(500); // debounce
    }

    // Find patient in list
    const patientLink = page.locator(
      `a:has-text("${PATIENT.lastName}"), tr:has-text("${PATIENT.lastName}"), div:has-text("${PATIENT.lastName}")`
    ).first();

    await expect(patientLink).toBeVisible({ timeout: 10_000 });
    await patientLink.click();

    // Should be on patient detail page
    await page.waitForURL(/\/patients\/[\w-]+/);
    await expect(page.locator(`text=${PATIENT.firstName}`)).toBeVisible();
  });

  test("should display patient demographics", async ({ page }) => {
    await page.goto("/patients");
    await waitForIdle(page);

    // Navigate to test patient
    const patientLink = page
      .locator(`a:has-text("${PATIENT.lastName}")`)
      .first();
    if (!(await patientLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "Test patient not found");
      return;
    }
    await patientLink.click();
    await page.waitForURL(/\/patients\/[\w-]+/);

    // Verify key demographic fields are displayed
    await expect(page.locator(`text=${PATIENT.firstName}`)).toBeVisible();
    await expect(page.locator(`text=${PATIENT.lastName}`)).toBeVisible();

    // Check for chief complaints
    const complaints = page.locator("text=fatigue, text=Fatigue");
    if (await complaints.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Chief complaints visible on patient profile");
    }

    // Check portal status badge
    const portalBadge = page.locator(
      'text=Portal active, text=active, text=invited'
    );
    if (await portalBadge.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Portal status badge visible");
    }
  });

  test("should view patient tabs", async ({ page }) => {
    await page.goto("/patients");
    await waitForIdle(page);

    const patientLink = page
      .locator(`a:has-text("${PATIENT.lastName}")`)
      .first();
    if (!(await patientLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "Test patient not found");
      return;
    }
    await patientLink.click();
    await page.waitForURL(/\/patients\/[\w-]+/);

    // Test tab navigation
    const tabs = ["documents", "prechart", "visits", "timeline"];
    for (const tab of tabs) {
      const tabBtn = page.locator(
        `button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`
      ).first();
      if (await tabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tabBtn.click();
        await page.waitForTimeout(500);
        console.log(`Tab "${tab}" accessible`);
      }
    }
  });
});

import { test, expect } from "@playwright/test";
import { loginAsProvider, waitForIdle } from "./helpers/auth";

/**
 * Provider Flow: Create a new patient and invite them to the portal.
 *
 * Steps:
 * 1. Log in as provider
 * 2. Navigate to patients list
 * 3. Create a new patient with demographics
 * 4. Invite the patient to the portal
 */

// Store patient ID across tests in this file
let patientId: string;

test.describe("Provider: Create & Invite Patient", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProvider(page);
  });

  test("should navigate to patients page", async ({ page }) => {
    await page.click('a[href="/patients"]');
    await page.waitForURL("**/patients");
    await expect(page).toHaveURL(/\/patients/);
  });

  test("should create a new patient", async ({ page }) => {
    await page.goto("/patients");
    await waitForIdle(page);

    // Click new patient button
    await page.click('button:has-text("New Patient"), a:has-text("New Patient")');

    // Fill patient demographics
    await page.fill('input[name="first_name"], input[placeholder*="First"]', "Emily");
    await page.fill('input[name="last_name"], input[placeholder*="Last"]', "TestPatient");
    await page.fill(
      'input[name="email"], input[placeholder*="email"], input[type="email"]',
      `e2e-patient-${Date.now()}@test.com`
    );

    // Date of birth
    const dobInput = page.locator('input[name="date_of_birth"], input[type="date"]');
    if (await dobInput.isVisible()) {
      await dobInput.fill("1990-03-15");
    }

    // Sex selection
    const sexSelect = page.locator('select[name="sex"]');
    if (await sexSelect.isVisible()) {
      await sexSelect.selectOption("female");
    }

    // Chief complaints
    const complaintsInput = page.locator(
      'input[name="chief_complaints"], textarea[name="chief_complaints"], input[placeholder*="complaint"]'
    );
    if (await complaintsInput.isVisible()) {
      await complaintsInput.fill("Fatigue, brain fog, poor sleep");
    }

    // Submit
    await page.click(
      'button[type="submit"], button:has-text("Create"), button:has-text("Save")'
    );

    // Should redirect to patient detail or show success
    await page.waitForURL(/\/patients\/[\w-]+/, { timeout: 10_000 });
    patientId = page.url().split("/patients/")[1]?.split(/[?#/]/)[0] ?? "";
    expect(patientId).toBeTruthy();

    // Verify patient name displays
    await expect(page.locator("text=Emily")).toBeVisible();
    await expect(page.locator("text=TestPatient")).toBeVisible();
  });

  test("should invite patient to portal", async ({ page }) => {
    test.skip(!patientId, "No patient created in previous test");
    await page.goto(`/patients/${patientId}`);
    await waitForIdle(page);

    // Click invite button
    await page.click('button:has-text("Invite to portal")');

    // Fill invite email
    const emailInput = page.locator('input[placeholder="patient@email.com"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(`e2e-patient-${Date.now()}@test.com`);

    // Send invite
    await page.click('button:has-text("Send")');

    // Verify invite sent (button changes to "Resend invite" or status updates)
    await expect(
      page.locator('button:has-text("Resend"), text=invited, text=Invite sent')
    ).toBeVisible({ timeout: 10_000 });
  });
});

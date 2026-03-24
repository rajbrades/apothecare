import { test, expect } from "@playwright/test";
import { loginAsPatient, PATIENT, waitForIdle } from "./helpers/auth";

/**
 * Patient Portal: Onboarding flow (consents + intake).
 *
 * Uses the pre-seeded patient (patient@test.com) from seed-portal-test.ts.
 * That patient is already portal-active, so this tests the consent/intake
 * pages directly. For a fresh invite flow, run 01-provider-creates-patient first.
 *
 * Steps:
 * 1. Log in as patient
 * 2. Navigate through consent documents (sign each)
 * 3. Complete intake form with health history
 * 4. Arrive at patient dashboard
 */

test.describe("Patient Portal: Onboarding", () => {
  test("should log in to patient portal", async ({ page }) => {
    await loginAsPatient(page);

    // Should be on portal dashboard or onboarding
    const url = page.url();
    expect(
      url.includes("/portal/dashboard") ||
        url.includes("/portal/onboarding")
    ).toBeTruthy();
  });

  test("should complete consent documents", async ({ page }) => {
    await page.goto("/portal/onboarding/consents");

    // Check if consents page loads (may redirect if already completed)
    const isConsentsPage = await page
      .locator("text=Review & sign")
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!isConsentsPage) {
      test.skip(true, "Consents already completed for this patient");
      return;
    }

    // Step through each consent document
    let hasMore = true;
    while (hasMore) {
      // Wait for consent content to load
      await expect(
        page.locator('input[placeholder="Your full legal name"]')
      ).toBeVisible({ timeout: 10_000 });

      // Read document title
      const title = await page.locator("h2").first().textContent();
      console.log(`Signing consent: ${title}`);

      // Type signature
      await page.fill(
        'input[placeholder="Your full legal name"]',
        `${PATIENT.firstName} ${PATIENT.lastName}`
      );

      // Click agree button
      const agreeBtn = page.locator('button:has-text("I agree")');
      await expect(agreeBtn).toBeEnabled();
      await agreeBtn.click();

      // Check if we moved to intake or another consent
      await page.waitForTimeout(1000);
      hasMore = await page
        .locator('input[placeholder="Your full legal name"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);
    }

    // Should have moved to intake page
    await expect(page).toHaveURL(/\/intake|\/dashboard/);
  });

  test("should complete intake form", async ({ page }) => {
    await page.goto("/portal/onboarding/intake");

    // Check if intake page loads
    const isIntakePage = await page
      .locator("text=Health intake")
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!isIntakePage) {
      test.skip(true, "Intake already completed or not available");
      return;
    }

    // Fill in all visible form fields
    const textInputs = page.locator(
      'input[id^="field-"]:visible, textarea[id^="field-"]:visible'
    );
    const count = await textInputs.count();

    const sampleAnswers: Record<string, string> = {
      medical_history:
        "Hashimoto's thyroiditis (2021). IBS-D since 2019. Seasonal allergies.",
      current_medications: "Levothyroxine 75mcg daily, Loratadine PRN",
      supplements:
        "Vitamin D3 5000IU, Magnesium glycinate 400mg, B-complex, Fish oil 2g",
      allergies: "Sulfa drugs, Shellfish",
      chief_complaints: "Chronic fatigue, Brain fog, Poor sleep quality",
      notes:
        "Symptoms worsened in the past 3 months. Interested in functional medicine approach.",
    };

    for (let i = 0; i < count; i++) {
      const input = textInputs.nth(i);
      const id = (await input.getAttribute("id")) ?? "";
      const fieldKey = id.replace("field-", "");

      const answer =
        sampleAnswers[fieldKey] ??
        `E2E test answer for ${fieldKey} — ${new Date().toISOString()}`;
      await input.fill(answer);
    }

    // Submit intake form
    const submitBtn = page.locator(
      'button:has-text("Submit"), button[type="submit"]'
    );
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Should redirect to portal dashboard
    await page.waitForURL("**/portal/dashboard", { timeout: 15_000 });
    await expect(page.locator("text=Welcome")).toBeVisible();
  });

  test("should see shared records on patient dashboard", async ({ page }) => {
    await loginAsPatient(page);

    // Navigate to dashboard
    await page.goto("/portal/dashboard");
    await waitForIdle(page);

    // Verify greeting
    await expect(page.locator("h1")).toContainText("Welcome");

    // Check for lab reports section
    const labsSection = page.locator("text=LAB REPORTS");
    if (await labsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      const labLinks = page.locator('a[href*="/portal/labs/"]');
      const labCount = await labLinks.count();
      console.log(`Patient has ${labCount} lab report(s) shared`);

      // Click first lab report if available
      if (labCount > 0) {
        await labLinks.first().click();
        await page.waitForURL("**/portal/labs/**");
        await expect(page.locator("text=Biomarker, text=Result")).toBeVisible({
          timeout: 5000,
        });
        await page.goBack();
      }
    }

    // Check for encounter notes section
    const notesSection = page.locator("text=ENCOUNTER NOTES");
    if (await notesSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      const noteLinks = page.locator('a[href*="/portal/notes/"]');
      const noteCount = await noteLinks.count();
      console.log(`Patient has ${noteCount} encounter note(s) shared`);
    }

    // Verify sign out works
    await page.click('button:has-text("Sign out")');
    await page.waitForURL("**/portal/login");
  });
});

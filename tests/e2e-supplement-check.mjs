/**
 * Playwright smoke test for patient supplement list.
 * Run: node tests/e2e-supplement-check.mjs
 *
 * Launches Chrome, signs in if needed (waits for you), then tests
 * the structured supplement section on the patient Overview tab.
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PATIENT_URL = `${BASE}/patients/b7e41c57-2ea4-4da2-8da2-4ace4fc231fb`;

const results = [];
function log(label, pass, detail = "") {
  const icon = pass ? "\u2705" : "\u274C";
  results.push({ label, pass, detail });
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function run() {
  const userDataDir = `/tmp/pw-supplement-test`;
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    channel: "chrome",
  });
  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Navigate to dashboard — will redirect to login if not authed
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });

    if (page.url().includes("/auth/login")) {
      console.log("\n🔐 Not authenticated. Please sign in in the browser window...");
      console.log("   Waiting for redirect to /dashboard...\n");
      await page.waitForURL("**/dashboard**", { timeout: 120000 });
      await page.waitForLoadState("networkidle");
    }
    log("Authenticated", true, "Dashboard loaded");

    // 2. Navigate to patient profile
    await page.goto(PATIENT_URL, { waitUntil: "networkidle", timeout: 15000 });
    log("Patient profile loaded", page.url().includes("/patients/"), page.url());

    // 3. Check Overview tab is active
    const overviewTab = page.locator('button:has-text("Overview")');
    await overviewTab.waitFor({ timeout: 5000 });
    log("Overview tab visible", true);

    // 4. Check all editable section headers
    for (const section of [
      "Chief Complaints",
      "Medical History",
      "Current Medications",
      "Current Supplements",
      "Allergies",
      "Notes",
    ]) {
      const header = page.locator(`h3:has-text("${section}")`);
      const visible = await header.isVisible().catch(() => false);
      log(`${section} section`, visible);
    }

    // 5. Check pencil (edit) icons exist
    const pencilIcons = page.locator('[title*="Edit"]');
    const pencilCount = await pencilIcons.count();
    log("Edit pencil icons present", pencilCount >= 4, `Found ${pencilCount} pencil icons`);

    // 6. Check supplement section state
    const addButton = page.locator('button:has-text("Add supplement")');
    const addVisible = await addButton.isVisible().catch(() => false);
    const plusButton = page.locator('[title="Add supplement"]');
    const plusVisible = await plusButton.isVisible().catch(() => false);

    if (addVisible) {
      log("Supplement empty state", true, '"+ Add supplement" button visible');

      // 7. Test adding a supplement
      await addButton.click();
      await page.waitForTimeout(300);

      const nameInput = page.locator('input[placeholder="Supplement name *"]');
      const nameVisible = await nameInput.isVisible().catch(() => false);
      log("Add form opened", nameVisible);

      if (nameVisible) {
        await nameInput.fill("Vitamin D3");
        await page.locator('input[placeholder*="Dosage"]').fill("5000 IU");
        await page.locator('input[placeholder*="Form"]').fill("softgel");
        await page.locator('input[placeholder*="Frequency"]').fill("1x daily");
        await page.locator('input[placeholder*="Timing"]').fill("with breakfast");
        log("Form fields filled", true);

        // Click Add
        const submitBtn = page.locator('button:has-text("Add")').last();
        await submitBtn.click();
        await page.waitForTimeout(2000);

        // Check row appeared
        const vitD = page.locator('span:has-text("Vitamin D3")');
        const vitDVisible = await vitD.isVisible().catch(() => false);
        log("Supplement added", vitDVisible, vitDVisible ? "Vitamin D3 row visible" : "Row not found");

        if (vitDVisible) {
          const detail = page.locator('text=5000 IU');
          const detailVisible = await detail.isVisible().catch(() => false);
          log("Detail line (dosage)", detailVisible, "5000 IU visible");
        }
      }
    } else if (plusVisible) {
      log("Supplements already exist", true, "Header + button visible for adding more");
    } else {
      log("Supplement section state", false, "Neither add button nor + icon found");
    }

    // 8. Screenshot
    await page.screenshot({ path: "supplement-test-result.png", fullPage: false });
    log("Screenshot saved", true, "supplement-test-result.png");

  } catch (err) {
    log("Test error", false, err.message);
    await page.screenshot({ path: "supplement-test-error.png", fullPage: false }).catch(() => {});
  } finally {
    console.log("\n─── Summary ───");
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    console.log(`${passed} passed, ${failed} failed out of ${results.length} checks\n`);

    await page.waitForTimeout(3000);
    await context.close();
  }
}

run().catch(console.error);

/**
 * Playwright smoke test for patient archive / permanent delete UI.
 * Run: node tests/e2e-archive-check.mjs
 *
 * Uses persistent Chrome context — sign in manually if prompted.
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
  const userDataDir = `/tmp/pw-archive-test`;
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    channel: "chrome",
  });
  const page = context.pages()[0] || (await context.newPage());

  try {
    // 1. Auth
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });

    if (page.url().includes("/auth/login")) {
      console.log("\n\uD83D\uDD10 Not authenticated. Please sign in in the browser window...");
      console.log("   Waiting for redirect to /dashboard...\n");
      await page.waitForURL("**/dashboard**", { timeout: 120000 });
      await page.waitForLoadState("networkidle");
    }
    log("Authenticated", true, "Dashboard loaded");

    // 2. Navigate to patient profile
    await page.goto(PATIENT_URL, { waitUntil: "networkidle", timeout: 15000 });
    log("Patient profile loaded", page.url().includes("/patients/"), page.url());

    // 3. Find the "..." menu button
    const menuButton = page.locator('button[title="Patient actions"]');
    const menuVisible = await menuButton.isVisible().catch(() => false);
    log("Actions menu button (⋮) visible", menuVisible);

    if (!menuVisible) {
      throw new Error("Cannot find the actions menu button — stopping");
    }

    // 4. Click the menu
    await menuButton.click();
    await page.waitForTimeout(300);

    // 5. Check for "Archive Patient" option
    const archiveOption = page.locator('button:has-text("Archive Patient")');
    const archiveVisible = await archiveOption.isVisible().catch(() => false);
    log("Archive Patient menu item", archiveVisible);

    // Screenshot the menu
    await page.screenshot({ path: "archive-menu-open.png", fullPage: false });
    log("Screenshot: menu open", true, "archive-menu-open.png");

    if (archiveVisible) {
      // 6. Click "Archive Patient" — should open confirmation dialog
      await archiveOption.click();
      await page.waitForTimeout(300);

      const dialogTitle = page.locator('h2:has-text("Archive Patient")');
      const dialogVisible = await dialogTitle.isVisible().catch(() => false);
      log("Archive confirmation dialog", dialogVisible);

      await page.screenshot({ path: "archive-confirm-dialog.png", fullPage: false });
      log("Screenshot: confirmation dialog", true, "archive-confirm-dialog.png");

      // 7. Click "Archive" to confirm
      const archiveBtn = page.locator('button:has-text("Archive")').last();
      await archiveBtn.click();
      await page.waitForTimeout(2000);

      // 8. Check for archived banner
      const banner = page.locator('text=This patient has been archived');
      const bannerVisible = await banner.isVisible().catch(() => false);
      log("Archived banner appeared", bannerVisible);

      // 9. Check Restore + Permanently Delete buttons
      const restoreBtn = page.locator('button:has-text("Restore")');
      const restoreVisible = await restoreBtn.isVisible().catch(() => false);
      log("Restore button visible", restoreVisible);

      const permDeleteBtn = page.locator('button:has-text("Permanently Delete")');
      const permDeleteVisible = await permDeleteBtn.isVisible().catch(() => false);
      log("Permanently Delete button visible", permDeleteVisible);

      // 10. Check "New Visit" is hidden
      const newVisitBtn = page.locator('a:has-text("New Visit")');
      const newVisitVisible = await newVisitBtn.isVisible().catch(() => false);
      log("New Visit hidden when archived", !newVisitVisible);

      await page.screenshot({ path: "archive-banner-state.png", fullPage: false });
      log("Screenshot: archived state", true, "archive-banner-state.png");

      // 11. Click "Permanently Delete" to see the typed-confirmation dialog
      await permDeleteBtn.first().click();
      await page.waitForTimeout(300);

      const deleteDialogTitle = page.locator('h2:has-text("Permanently Delete Patient")');
      const deleteDialogVisible = await deleteDialogTitle.isVisible().catch(() => false);
      log("Permanent delete dialog opened", deleteDialogVisible);

      // 12. Check the delete button is disabled (no input yet)
      const deleteConfirmBtn = page.locator('button:has-text("Permanently Delete")').last();
      const isDisabled = await deleteConfirmBtn.isDisabled().catch(() => false);
      log("Delete button disabled before typing", isDisabled);

      await page.screenshot({ path: "archive-delete-dialog.png", fullPage: false });
      log("Screenshot: delete dialog", true, "archive-delete-dialog.png");

      // 13. Close delete dialog and restore the patient
      const cancelBtn = page.locator('button:has-text("Cancel")');
      await cancelBtn.click();
      await page.waitForTimeout(300);

      // Restore the patient so we leave state clean
      const restoreBtnAfter = page.locator('button:has-text("Restore")').first();
      if (await restoreBtnAfter.isVisible().catch(() => false)) {
        await restoreBtnAfter.click();
        await page.waitForTimeout(2000);

        const bannerGone = !(await banner.isVisible().catch(() => false));
        log("Patient restored (banner gone)", bannerGone);

        await page.screenshot({ path: "archive-restored.png", fullPage: false });
        log("Screenshot: restored state", true, "archive-restored.png");
      }
    }
  } catch (err) {
    log("Test error", false, err.message);
    await page.screenshot({ path: "archive-test-error.png", fullPage: false }).catch(() => {});
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

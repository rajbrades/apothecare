/**
 * Playwright headless smoke test for RAG source filter + source badges.
 * Run: node tests/e2e-source-filter-badges.mjs
 *
 * Tests:
 *  1. Source filter popover opens and shows "Partner Knowledge Bases" category
 *  2. Apex Energetics appears as a selectable source
 *  3. Functional Core preset includes Apex Energetics
 *  4. Individual source toggle works (select/deselect)
 *  5. Selecting only Apex restricts the source label
 *  6. Sending a message with Apex-only filter passes source_filter in the request
 *  7. RAG source badge renders on citations when ragSource metadata is present
 *
 * Uses persistent Chrome context — sign in manually if prompted on first run.
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const CHAT_URL = `${BASE}/chat`;

const results = [];
function log(label, pass, detail = "") {
  const icon = pass ? "\u2705" : "\u274C";
  results.push({ label, pass, detail });
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function run() {
  const userDataDir = `/tmp/pw-source-filter-test`;
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    viewport: { width: 1440, height: 900 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = context.pages()[0] || await context.newPage();

  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });

    if (page.url().includes("/auth/login")) {
      console.log("\n\uD83D\uDD10 Not authenticated. Please sign in in the browser window...");
      console.log("   Waiting for redirect to /dashboard...\n");
      await page.waitForURL("**/dashboard**", { timeout: 120000 });
      await page.waitForLoadState("networkidle");
    }
    log("Authenticated", true, "Dashboard loaded");

    // ── 2. Navigate to chat ──────────────────────────────────────────────
    await page.goto(CHAT_URL, { waitUntil: "networkidle", timeout: 15000 });
    log("Chat page loaded", page.url().includes("/chat"), page.url());

    // ── 3. Open source filter popover ────────────────────────────────────
    // The button text defaults to "Sources" when all are selected
    const sourceButton = page.locator('button:has-text("Sources")').first();
    await sourceButton.waitFor({ timeout: 8000 });
    await sourceButton.click();
    log("Source filter button clicked", true);

    // Wait for popover to appear
    const popover = page.locator('text="Evidence Sources"');
    await popover.waitFor({ timeout: 3000 });
    log("Source filter popover opened", true);

    // ── 4. Check "Partner Knowledge Bases" category exists ───────────────
    const partnerCategory = page.locator('text="Partner Knowledge Bases"');
    const partnerVisible = await partnerCategory.isVisible().catch(() => false);
    log("Partner Knowledge Bases category visible", partnerVisible);

    // ── 5. Check Apex Energetics source appears ──────────────────────────
    const apexSource = page.locator('button:has-text("Apex Energetics")');
    const apexVisible = await apexSource.isVisible().catch(() => false);
    log("Apex Energetics source visible", apexVisible);

    // ── 6. Check all expected categories ─────────────────────────────────
    for (const category of [
      "Functional / Integrative",
      "Partner Knowledge Bases",
      "Conventional",
      "General Literature",
    ]) {
      const el = page.locator(`text="${category}"`);
      const visible = await el.isVisible().catch(() => false);
      log(`Category: ${category}`, visible);
    }

    // ── 7. Click "Functional Core" preset ────────────────────────────────
    const functionalCoreBtn = page.locator('button:has-text("Functional Core")');
    const fcVisible = await functionalCoreBtn.isVisible().catch(() => false);
    if (fcVisible) {
      await functionalCoreBtn.click();
      log("Functional Core preset clicked", true);

      // Verify Apex is checked (has active bg class)
      const apexChecked = page.locator('button:has-text("Apex Energetics")').locator('..');
      const apexClasses = await apexChecked.getAttribute("class").catch(() => "");
      // The button itself should have the brand-50 bg when selected
      const apexBtn = page.locator('button:has-text("Apex Energetics")');
      const apexBtnClass = await apexBtn.getAttribute("class").catch(() => "");
      const isApexSelected = apexBtnClass.includes("brand-50");
      log("Apex included in Functional Core preset", isApexSelected, apexBtnClass.substring(0, 80));
    } else {
      log("Functional Core preset clicked", false, "Button not visible");
    }

    // ── 8. Select ONLY Apex Energetics ───────────────────────────────────
    // First deselect all others by clicking each selected source
    const allSourceButtons = page.locator(
      '.space-y-0\\.5 button'
    );
    const count = await allSourceButtons.count();

    // Click Apex first to ensure it's selected
    if (apexVisible) {
      const apexCheckbox = page.locator('button:has-text("Apex Energetics")');
      const apexClass = await apexCheckbox.getAttribute("class").catch(() => "");
      if (!apexClass.includes("brand-50")) {
        await apexCheckbox.click();
      }
    }

    // Now deselect every other source (can't deselect last one)
    for (let i = 0; i < count; i++) {
      const btn = allSourceButtons.nth(i);
      const text = await btn.innerText().catch(() => "");
      if (text.includes("Apex Energetics")) continue; // keep Apex selected
      const cls = await btn.getAttribute("class").catch(() => "");
      if (cls.includes("brand-50")) {
        await btn.click();
        await page.waitForTimeout(100);
      }
    }

    // Close popover
    const closeBtn = page.locator('button:has([class*="lucide-x"])').first();
    const closeVisible = await closeBtn.isVisible().catch(() => false);
    if (closeVisible) {
      await closeBtn.click();
    } else {
      // Click outside popover
      await page.click("body", { position: { x: 10, y: 10 } });
    }
    await page.waitForTimeout(300);

    // The source button label should now show "Apex Energetics" (single source)
    const updatedLabel = page.locator('button:has-text("Apex Energetics")').first();
    const labelVisible = await updatedLabel.isVisible().catch(() => false);
    log("Source label shows Apex Energetics after selection", labelVisible);

    // ── 9. Intercept API request to verify source_filter is sent ─────────
    let capturedSourceFilter = null;
    await page.route("**/api/chat/stream", (route) => {
      const postData = route.request().postDataJSON();
      capturedSourceFilter = postData?.source_filter;
      // Respond with a minimal SSE to avoid waiting for real AI
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          `data: ${JSON.stringify({ type: "conversation_id", conversation_id: "test-conv-123" })}\n\n`,
          `data: ${JSON.stringify({ type: "text_delta", text: "Test response from Apex Energetics knowledge base. " })}\n\n`,
          `data: ${JSON.stringify({ type: "text_delta", text: "[Smith, 2023](https://doi.org/10.1234/test)" })}\n\n`,
          `data: ${JSON.stringify({
            type: "citation_metadata_multi",
            citationsByKey: {
              "[Smith, 2023]": [{
                citationText: "[Smith, 2023]",
                title: "Gut-Brain Axis and Functional Nutrition",
                source: "Journal of Functional Medicine",
                authors: ["Smith J", "Doe A"],
                year: "2023",
                doi: "10.1234/test",
                evidenceLevel: "rct",
                ragSource: "apex_energetics",
              }],
            },
          })}\n\n`,
          `data: ${JSON.stringify({
            type: "citations_resolved",
            content: "Test response from Apex Energetics knowledge base. [Smith, 2023](https://doi.org/10.1234/test)",
          })}\n\n`,
          `data: ${JSON.stringify({ type: "message_complete" })}\n\n`,
        ].join(""),
      });
    });

    // Type a message and send
    const textarea = page.locator("textarea").first();
    await textarea.waitFor({ timeout: 5000 });
    await textarea.fill("What supplements support gut health?");
    await textarea.press("Enter");

    // Wait for response
    await page.waitForTimeout(2000);

    log(
      "source_filter sent in API request",
      Array.isArray(capturedSourceFilter) && capturedSourceFilter.includes("apex_energetics"),
      capturedSourceFilter ? JSON.stringify(capturedSourceFilter) : "null"
    );

    log(
      "source_filter is Apex-only",
      Array.isArray(capturedSourceFilter) && capturedSourceFilter.length === 1 && capturedSourceFilter[0] === "apex_energetics",
      `Length: ${capturedSourceFilter?.length}`
    );

    // ── 10. Check that RAG source badge rendered ─────────────────────────
    // Wait a bit for citations to resolve and re-render
    await page.waitForTimeout(1500);

    // The badge should contain "Apex Energetics" text from RAG_SOURCE_CONFIG
    const sourceBadge = page.locator('text="Apex Energetics"');
    const badgeCount = await sourceBadge.count();
    // At least one instance should be in the evidence badge (not just the source filter button)
    // Look specifically for the small pill-style badge
    const ragBadgePill = page.locator('span:has-text("Apex Energetics")').filter({
      has: page.locator('[class*="text-[9px]"], [class*="text-\\[10px\\]"]'),
    });
    const pillCount = await ragBadgePill.count().catch(() => 0);

    // Also check for the evidence badge button itself (RCT label)
    const evidenceBadge = page.locator('button:has-text("RCT")');
    const evidenceBadgeVisible = await evidenceBadge.isVisible().catch(() => false);
    log("Evidence badge (RCT) rendered", evidenceBadgeVisible);

    // Check for any "Apex Energetics" text that's styled as a badge (small text)
    const allApexTexts = page.locator('span:text-is("Apex Energetics")');
    const apexTextCount = await allApexTexts.count();
    // Should have at least 2: one in the source filter button label, one in the badge
    log(
      "RAG source badge pill rendered",
      apexTextCount >= 2 || pillCount > 0,
      `Found ${apexTextCount} 'Apex Energetics' text elements, ${pillCount} badge pills`
    );

    // ── 11. Screenshot for visual verification ───────────────────────────
    await page.screenshot({ path: "/tmp/e2e-source-filter-badges.png", fullPage: false });
    log("Screenshot saved", true, "/tmp/e2e-source-filter-badges.png");

  } catch (err) {
    log("Unexpected error", false, err.message);
    await page.screenshot({ path: "/tmp/e2e-source-filter-error.png" }).catch(() => {});
  } finally {
    await context.close();

    // Summary
    console.log("\n─── Summary ───");
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    console.log(`${passed} passed, ${failed} failed out of ${results.length} checks`);

    if (failed > 0) {
      console.log("\nFailed:");
      results.filter((r) => !r.pass).forEach((r) => {
        console.log(`  \u274C ${r.label}${r.detail ? ` — ${r.detail}` : ""}`);
      });
    }

    process.exit(failed > 0 ? 1 : 0);
  }
}

run();

import { defineConfig, devices } from "@playwright/test";

/**
 * Apothecare E2E Test Configuration
 *
 * Prerequisites:
 *   1. Copy .env.example to .env.local and fill in Supabase credentials
 *   2. Run seed scripts:
 *      - node scripts/create-test-user.js    (provider: test@apothecare.com / Test123456!)
 *      - npx tsx scripts/seed-portal-test.ts  (patient: patient@test.com / testtest123)
 *   3. Start dev server: npm run dev
 *   4. Run tests: npx playwright test
 *
 * If SITE_PASSWORD is set, add it to E2E_SITE_PASSWORD env var.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // tests depend on sequential flow
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Grant microphone permission for voice recorder tests
        permissions: ["microphone"],
        launchOptions: {
          args: [
            "--use-fake-device-for-media-stream",
            "--use-fake-ui-for-media-stream",
          ],
        },
      },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 30_000,
      },
});

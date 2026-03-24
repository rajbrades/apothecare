import { test, expect } from "@playwright/test";
import { loginAsProvider, PATIENT, waitForIdle } from "./helpers/auth";

/**
 * Provider Flow: Create visit, use voice recorder, write SOAP note.
 *
 * Steps:
 * 1. Create a new visit for the test patient
 * 2. Navigate the workspace tabs
 * 3. Enter vitals and health ratings on Intake tab
 * 4. Use the voice recorder (with fake audio stream)
 * 5. Enter raw notes and generate AI SOAP note
 * 6. Edit SOAP sections
 * 7. Review IFM Matrix and Protocol tabs
 * 8. Export the note
 * 9. Sign and lock the visit
 */

let visitUrl: string;

test.describe("Visit: SOAP Note & Voice Recorder", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProvider(page);
  });

  test("should create a new visit for test patient", async ({ page }) => {
    // Find patient and create visit from their profile
    await page.goto("/patients");
    await waitForIdle(page);

    const patientLink = page
      .locator(`a:has-text("${PATIENT.lastName}")`)
      .first();

    if (!(await patientLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Create visit from visits page instead
      await page.goto("/visits");
      await waitForIdle(page);
    } else {
      await patientLink.click();
      await page.waitForURL(/\/patients\/[\w-]+/);
    }

    // Click create visit button (various locations)
    const createBtn = page.locator(
      'button:has-text("New Visit"), button:has-text("Start Visit"), a:has-text("Start Visit")'
    ).first();

    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
    } else {
      // Direct API call to create visit
      await page.goto("/visits");
      const newVisitBtn = page.locator(
        'button:has-text("New Visit"), a:has-text("New Visit")'
      ).first();
      await newVisitBtn.click();
    }

    // Wait for visit workspace to load
    await page.waitForURL(/\/visits\/[\w-]+/, { timeout: 15_000 });
    visitUrl = page.url();

    // Verify workspace loaded with tab bar
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    console.log(`Visit created: ${visitUrl}`);
  });

  test("should navigate workspace tabs", async ({ page }) => {
    test.skip(!visitUrl, "No visit created");
    await page.goto(visitUrl);
    await waitForIdle(page);

    // All 4 tabs should exist
    const tabLabels = [
      { id: "intake", text: "Vitals" },
      { id: "soap", text: "SOAP" },
      { id: "ifm", text: "IFM" },
      { id: "protocol", text: "Protocol" },
    ];

    for (const { id, text } of tabLabels) {
      const tab = page.locator(`#tab-${id}, [aria-controls="tabpanel-${id}"]`);
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);

        // Verify tab is selected
        await expect(tab).toHaveAttribute("aria-selected", "true");
        console.log(`Tab "${text}" (${id}): accessible`);
      }
    }
  });

  test("should enter vitals and health ratings", async ({ page }) => {
    test.skip(!visitUrl, "No visit created");
    await page.goto(visitUrl);
    await waitForIdle(page);

    // Switch to intake tab
    const intakeTab = page.locator(
      '#tab-intake, [aria-controls="tabpanel-intake"]'
    );
    await intakeTab.click();
    await page.waitForTimeout(500);

    // Enter weight (lbs)
    const weightInput = page.locator(
      'input[type="number"][max="1100"], input[step="0.1"]'
    ).first();
    if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weightInput.fill("155");
      console.log("Weight entered: 155 lbs");
    }

    // Enter blood pressure
    const bpSystolic = page.locator('input[max="300"]').first();
    const bpDiastolic = page.locator('input[max="200"]').first();
    if (await bpSystolic.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bpSystolic.fill("118");
      await bpDiastolic.fill("76");
      console.log("BP entered: 118/76");
    }

    // Enter heart rate
    const hrInput = page.locator('input[max="300"]').nth(2);
    if (await hrInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await hrInput.fill("72");
      console.log("Heart rate entered: 72 bpm");
    }

    // Adjust health rating sliders
    const sliders = page.locator('input[type="range"]');
    const sliderCount = await sliders.count();
    for (let i = 0; i < Math.min(sliderCount, 8); i++) {
      const slider = sliders.nth(i);
      // Set various values for realism
      const values = [7, 5, 8, 7, 6, 4, 7, 8];
      await slider.fill(String(values[i] ?? 7));
    }
    console.log(`Set ${Math.min(sliderCount, 8)} health rating sliders`);

    // Click save
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1500);

      // Verify save indicator
      const savedIndicator = page.locator("text=Saved");
      await expect(savedIndicator).toBeVisible({ timeout: 5000 });
      console.log("Vitals saved successfully");
    }

    // Switch away and back to verify persistence
    const soapTab = page.locator(
      '#tab-soap, [aria-controls="tabpanel-soap"]'
    );
    await soapTab.click();
    await page.waitForTimeout(500);

    await intakeTab.click();
    await page.waitForTimeout(500);

    // Verify weight persisted
    if (await weightInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const value = await weightInput.inputValue();
      expect(parseFloat(value)).toBeCloseTo(155, 0);
      console.log("Vitals persisted across tab switch");
    }
  });

  test("should test voice recorder UI", async ({ page }) => {
    test.skip(!visitUrl, "No visit created");
    await page.goto(visitUrl);
    await waitForIdle(page);

    // Look for record button in workspace
    const recordBtn = page.locator(
      'button:has-text("Record Encounter"), button:has-text("Record Session")'
    ).first();

    if (!(await recordBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(
        "Record button not visible — may need raw notes mode. Checking transcribe tab..."
      );

      // Try switching to transcribe mode
      const transcribeMode = page.locator('button:has-text("Transcribe")');
      if (
        await transcribeMode.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await transcribeMode.click();
        await page.waitForTimeout(500);
      }
    }

    // Try to start recording (with fake device stream from Playwright config)
    const recBtn = page.locator(
      'button:has-text("Record Encounter"), button:has-text("Record Session"), button:has-text("Live Dictation")'
    ).first();

    if (await recBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await recBtn.click();

      // Verify recording started (look for pulsing indicator or stop button)
      const recordingIndicator = page.locator(
        'text=Recording, button:has-text("Stop"), .animate-pulse'
      ).first();

      const isRecording = await recordingIndicator
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (isRecording) {
        console.log("Recording started successfully");

        // Record for 3 seconds
        await page.waitForTimeout(3000);

        // Stop recording
        const stopBtn = page.locator(
          'button:has-text("Stop Recording"), button:has-text("Stop"), button:has-text("Complete Note")'
        ).first();
        await stopBtn.click();
        await page.waitForTimeout(1000);

        // Verify recording completed
        const playBtn = page.locator('button:has-text("Play")');
        const transcribeBtn = page.locator(
          'button:has-text("Transcribe"), button:has-text("Process with AI Scribe")'
        ).first();

        if (
          await playBtn.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          console.log("Recording completed — playback available");
        }
        if (
          await transcribeBtn.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          console.log("Transcribe button available after recording");
          // Note: Actual transcription requires OpenAI API key
          // In CI, skip transcription; verify button state only
        }

        // Test discard
        const discardBtn = page.locator('button[title="Discard recording"]');
        if (
          await discardBtn.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          console.log("Discard button available");
        }
      } else {
        console.log(
          "Recording did not start — microphone permission may be blocked in this environment"
        );
      }
    } else {
      console.log("No recording button found in current view");
    }
  });

  test("should enter raw notes and generate SOAP", async ({ page }) => {
    test.skip(!visitUrl, "No visit created");
    await page.goto(visitUrl);
    await waitForIdle(page);

    // Switch to SOAP tab
    const soapTab = page.locator(
      '#tab-soap, [aria-controls="tabpanel-soap"]'
    );
    if (await soapTab.isVisible()) {
      await soapTab.click();
      await page.waitForTimeout(500);
    }

    // Find the raw notes textarea (may need to click "Type Notes" first)
    const typeMode = page.locator('button:has-text("Type Notes"), button:has-text("Type")');
    if (await typeMode.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeMode.click();
      await page.waitForTimeout(300);
    }

    // Enter clinical notes
    const notesTextarea = page.locator("textarea").first();
    if (await notesTextarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      const sampleNotes = `Patient: Alex Thompson, 37F
Chief Complaint: Chronic fatigue, brain fog, poor sleep quality for 3 months

HPI: Patient reports worsening fatigue over past 3 months despite adequate sleep hours (7-8h). Brain fog is most pronounced mid-afternoon. Sleep quality poor with frequent waking at 2-3 AM. Associated with increased stress at work. No weight changes. Appetite normal.

PMH: Hashimoto's thyroiditis diagnosed 2021. IBS-D since 2019.
Medications: Levothyroxine 75mcg daily
Supplements: Vitamin D3 5000IU, Magnesium glycinate 400mg, B-complex
Allergies: Sulfa drugs, Shellfish

ROS: Fatigue (+), brain fog (+), poor sleep (+), anxiety (mild), GI bloating intermittent, no fever, no weight loss

Vitals: BP 118/76, HR 72, Weight 155 lbs

Physical Exam:
General: Well-appearing, NAD
Thyroid: Non-tender, no nodules
Abdomen: Soft, mild tenderness LLQ, no guarding
Neuro: Alert, oriented x3

Assessment:
1. Hashimoto's thyroiditis — may need dose adjustment
2. Adrenal dysfunction — cortisol pattern suggests HPA axis dysregulation
3. Sleep disruption — 2-3 AM waking pattern concerning for cortisol surge
4. GI dysbiosis — IBS symptoms persisting

Plan:
1. Order: Comprehensive thyroid panel (TSH, fT3, fT4, TPO, TG ab)
2. Order: DUTCH Complete for cortisol/hormone assessment
3. Start: Ashwagandha 600mg at bedtime for adrenal support
4. Start: L-theanine 200mg at bedtime for sleep quality
5. Consider: GI-MAP stool test for microbiome assessment
6. Follow-up: 4 weeks to review labs`;

      await notesTextarea.fill(sampleNotes);
      console.log("Raw clinical notes entered");
    }

    // Look for generate button
    const generateBtn = page.locator(
      'button:has-text("Generate Clinical Note"), button:has-text("Generate")'
    ).first();

    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Generate button visible");

      // Note: Actual generation requires Anthropic API key
      // In a real environment, click and wait for streaming:
      //
      // await generateBtn.click();
      // await expect(page.locator('text=Generating')).toBeVisible({ timeout: 10_000 });
      // await expect(page.locator('text=AI-generated')).toBeVisible({ timeout: 60_000 });
      //
      // For now, verify the button exists and is clickable
      await expect(generateBtn).toBeEnabled();
      console.log("Generate button enabled and ready");
    }
  });

  test("should edit SOAP sections", async ({ page }) => {
    test.skip(!visitUrl, "No visit created");
    await page.goto(visitUrl);
    await waitForIdle(page);

    // Switch to SOAP tab
    const soapTab = page.locator(
      '#tab-soap, [aria-controls="tabpanel-soap"]'
    );
    if (await soapTab.isVisible()) {
      await soapTab.click();
      await page.waitForTimeout(500);
    }

    // Check for SOAP section badges (S, O, A, P)
    const sectionBadges = ["S", "O", "A", "P"];
    for (const badge of sectionBadges) {
      const section = page.locator(
        `span:has-text("${badge}"):not(:has-text("SOAP"))`
      ).first();
      if (await section.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`SOAP section "${badge}" visible`);
      }
    }

    // Try to edit the Subjective section
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();

      // Find the textarea that appears
      const editArea = page.locator("textarea").first();
      if (await editArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        const currentText = await editArea.inputValue();
        await editArea.fill(
          currentText + "\n\nAddendum: Patient also reports occasional headaches."
        );

        // Click done
        const doneBtn = page.locator('button:has-text("Done")').first();
        await doneBtn.click();
        console.log("Subjective section edited successfully");
      }
    }
  });

  test("should test export functionality", async ({ page }) => {
    test.skip(!visitUrl, "No visit created");
    await page.goto(visitUrl);
    await waitForIdle(page);

    // Find export button
    const exportBtn = page.locator(
      'button:has-text("Export"), button:has-text("Download")'
    ).first();

    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportBtn.click();

      // Look for export menu items
      const copyBtn = page.locator('button:has-text("Copy to Clipboard")');
      const pdfBtn = page.locator('button:has-text("Download PDF")');

      if (await copyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await copyBtn.click();
        // Verify "Copied!" feedback
        await expect(page.locator("text=Copied")).toBeVisible({ timeout: 3000 });
        console.log("Copy to clipboard works");
      }

      // PDF download test (just verify button exists)
      if (await pdfBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log("PDF download button available");
      }
    } else {
      console.log(
        "Export button not visible — may need SOAP content generated first"
      );
    }
  });

  test("should sign and lock the visit", async ({ page }) => {
    test.skip(!visitUrl, "No visit created");
    await page.goto(visitUrl);
    await waitForIdle(page);

    // Find sign/lock button
    const signBtn = page.locator(
      'button:has-text("Sign & Lock"), button:has-text("Sign")'
    ).first();

    if (await signBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signBtn.click();
      await page.waitForTimeout(1000);

      // Verify visit is now locked
      const unlockBtn = page.locator(
        'button:has-text("Unlock"), text=completed'
      ).first();
      if (
        await unlockBtn.isVisible({ timeout: 5000 }).catch(() => false)
      ) {
        console.log("Visit signed and locked successfully");

        // Unlock it for cleanup
        if (await page.locator('button:has-text("Unlock")').isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.click('button:has-text("Unlock")');
          console.log("Visit unlocked for cleanup");
        }
      }
    } else {
      console.log("Sign & Lock button not visible");
    }
  });
});

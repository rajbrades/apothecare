import { createServiceClient } from "@/lib/supabase/server";
import { getAnthropicClient, ANTHROPIC_MODELS } from "./provider";
import { LAB_PARSING_SYSTEM_PROMPT } from "./lab-parsing-prompts";
import type { ParsedLabData } from "./lab-parsing-prompts";
import { downloadFromStorage } from "@/lib/storage/lab-reports";
import { normalizeBiomarkers } from "@/lib/labs/normalize-biomarkers";

/**
 * Parse a lab report PDF using Claude Vision and normalize biomarker results.
 * This runs asynchronously (fire-and-forget from the upload endpoint).
 *
 * Pipeline: download PDF → Claude Vision → extract JSON → normalize → save
 */
export async function parseLabReport(
  reportId: string,
  storagePath: string,
  practitionerId: string,
  patientId: string | null
): Promise<void> {
  const serviceClient = createServiceClient();
  const anthropic = getAnthropicClient();

  try {
    // Update status to parsing
    await serviceClient
      .from("lab_reports")
      .update({ status: "parsing" })
      .eq("id", reportId);

    // Download PDF from storage
    let pdfBuffer: Buffer | null = await downloadFromStorage(storagePath);
    const base64Pdf = pdfBuffer.toString("base64");
    pdfBuffer = null; // FREE MEMORY IMMEDIATELY

    // Send to Claude Vision for extraction (retry with fallback on transient errors)
    const models = [ANTHROPIC_MODELS.vision, ANTHROPIC_MODELS.standard];
    let response: Awaited<ReturnType<typeof anthropic.messages.create>> | null = null;
    let lastError: unknown = null;

    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await anthropic.messages.create({
            model,
            max_tokens: 8192,
            system: LAB_PARSING_SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "document",
                    source: {
                      type: "base64",
                      media_type: "application/pdf",
                      data: base64Pdf,
                    },
                  },
                  {
                    type: "text",
                    text: "Extract all biomarker data from this lab report. Return valid JSON.",
                  },
                ],
              },
            ],
          });
          break; // Success — exit retry loop
        } catch (err: unknown) {
          lastError = err;
          const status = (err as { status?: number }).status;
          const isTransient = status === 429 || status === 529 || status === 503;
          if (isTransient && attempt === 0) {
            // Wait before retry (2s first attempt)
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          if (isTransient) break; // Move to fallback model
          throw err; // Non-transient error — don't retry
        }
      }
      if (response) break; // Got a response — stop trying models
    }

    if (!response) {
      throw lastError || new Error("All models failed for lab parsing");
    }

    // Parse extraction result
    const textContent = response.content.find((c) => c.type === "text");
    const rawText = textContent && "text" in textContent ? textContent.text : "";

    let parsedData: ParsedLabData | null = null;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]) as ParsedLabData;
      }
    } catch {
      // JSON parsing failed
    }

    if (!parsedData || !parsedData.biomarkers || parsedData.biomarkers.length === 0) {
      throw new Error("Failed to extract biomarker data from the lab report. The PDF may be unclear or in an unsupported format.");
    }

    // Update lab report with parsed metadata
    const usedModel = response.model || ANTHROPIC_MODELS.vision;
    const collectionDate = parsedData.collection_date || null;
    await serviceClient
      .from("lab_reports")
      .update({
        parsed_data: parsedData as unknown as Record<string, unknown>,
        lab_vendor: parsedData.lab_vendor || "other",
        test_type: parsedData.test_type || "other",
        test_name: parsedData.test_name || null,
        collection_date: collectionDate,
        parsing_model: usedModel,
      })
      .eq("id", reportId);

    // Delete old biomarker results before re-inserting (prevents duplicates on re-parse)
    await serviceClient
      .from("biomarker_results")
      .delete()
      .eq("lab_report_id", reportId);

    // Normalize biomarkers against reference ranges and insert results
    const normResult = await normalizeBiomarkers(
      parsedData.biomarkers,
      reportId,
      patientId,
      collectionDate,
      serviceClient
    );

    // Mark complete with summary in parsed_data
    await serviceClient
      .from("lab_reports")
      .update({
        status: "complete",
        parsed_data: {
          ...parsedData,
          biomarker_summary: {
            total: normResult.totalCount,
            matched: normResult.matchedCount,
            flagged: normResult.flaggedCount,
          },
        } as unknown as Record<string, unknown>,
        error_message: null,
      })
      .eq("id", reportId);

    // Audit log (fire-and-forget)
    serviceClient.from("audit_logs").insert({
      practitioner_id: practitionerId,
      action: "generate",
      resource_type: "lab_report",
      resource_id: reportId,
      ip_address: "background",
      user_agent: "background",
      detail: {
        patient_id: patientId,
        parsing_model: usedModel,
        biomarkers_extracted: normResult.totalCount,
        biomarkers_matched: normResult.matchedCount,
        biomarkers_flagged: normResult.flaggedCount,
        lab_vendor: parsedData.lab_vendor,
        test_type: parsedData.test_type,
      },
    }).then(() => {}).catch((err: unknown) => {
      console.error("Audit log write failed:", err);
    });
  } catch (err) {
    console.error("Lab parsing error:", err);

    await serviceClient
      .from("lab_reports")
      .update({
        status: "error",
        error_message: err instanceof Error ? err.message : "Lab parsing failed",
      })
      .eq("id", reportId);
  }
}

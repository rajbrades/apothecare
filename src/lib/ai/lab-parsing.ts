import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { ANTHROPIC_MODELS } from "./provider";
import { LAB_PARSING_SYSTEM_PROMPT } from "./lab-parsing-prompts";
import type { ParsedLabData } from "./lab-parsing-prompts";
import { downloadFromStorage } from "@/lib/storage/lab-reports";
import { normalizeBiomarkers } from "@/lib/labs/normalize-biomarkers";
import { env } from "@/lib/env";

/**
 * Get a direct Anthropic client for vision features.
 * Always uses ANTHROPIC_API_KEY directly — never routed through MiniMax,
 * because MiniMax doesn't support the `document` content type for PDF vision.
 */
function getDirectAnthropicClient(): Anthropic {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Lab parsing requires a direct Anthropic API key — set it in your environment variables."
    );
  }
  return new Anthropic({ apiKey });
}

/**
 * Extract a human-readable error message from Anthropic SDK errors.
 */
function formatApiError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    const status = err.status;
    const type = (err.error as Record<string, unknown>)?.error
      ? ((err.error as Record<string, Record<string, unknown>>).error?.type as string)
      : undefined;

    if (status === 401) return "Anthropic API key is invalid or expired. Check your ANTHROPIC_API_KEY environment variable.";
    if (status === 403) return "Anthropic API key lacks permission for this operation. Ensure your plan supports the Claude model being used.";
    if (status === 429) return "Anthropic API rate limit exceeded. Please wait a moment and retry.";
    if (status === 529) return "Anthropic API is temporarily overloaded. Please retry in a few minutes.";
    if (status === 413) return "Lab report PDF is too large for the API. Try a smaller or lower-resolution scan.";

    return `Anthropic API error (${status}${type ? `, ${type}` : ""}): ${err.message}`;
  }
  if (err instanceof Error) return err.message;
  return "Lab parsing failed due to an unknown error.";
}

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
  const anthropic = getDirectAnthropicClient();

  try {
    // Update status to parsing
    await serviceClient
      .from("lab_reports")
      .update({ status: "parsing" })
      .eq("id", reportId);

    // Download PDF from storage
    const pdfBuffer: Buffer = await downloadFromStorage(storagePath);

    // Strategy: Try text extraction first (fast Sonnet path), fall back to vision (slow Opus path)
    let extractedText = "";
    try {
      const { extractText } = await import("unpdf");
      const { text: pages } = await extractText(new Uint8Array(pdfBuffer), { mergePages: true });
      extractedText = Array.isArray(pages) ? pages.join("\n") : (pages ?? "");
    } catch {
      // Text extraction failed — will use vision
    }

    const useTextPath = extractedText.trim().length > 200; // Has meaningful text content
    console.log(`[Lab Parse] Strategy: ${useTextPath ? "TEXT (Sonnet)" : "VISION (Opus)"}, text length: ${extractedText.length}`);

    let response: Awaited<ReturnType<typeof anthropic.messages.create>> | null = null;
    let lastError: unknown = null;

    if (useTextPath) {
      // FAST PATH: Text-based PDF → Sonnet text completion (5-15 seconds)
      try {
        response = await anthropic.messages.create({
          model: ANTHROPIC_MODELS.standard, // Sonnet — fast
          max_tokens: 16384,
          system: LAB_PARSING_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Extract all biomarker data from this lab report text. Return valid JSON.\n\n---LAB REPORT TEXT---\n${extractedText}`,
            },
          ],
        });
      } catch (err: unknown) {
        lastError = err;
        console.warn("[Lab Parse] Sonnet text path failed, falling back to vision:", err);
      }
    }

    if (!response) {
      // SLOW PATH: Image/scanned PDF or text path failed → Vision (30-90 seconds)
      const base64Pdf = pdfBuffer.toString("base64");
      const models = [ANTHROPIC_MODELS.standard, ANTHROPIC_MODELS.vision]; // Try Sonnet first, Opus fallback

      for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            response = await anthropic.messages.create({
              model,
              max_tokens: 16384,
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
            break;
          } catch (err: unknown) {
            lastError = err;
            const status = (err as { status?: number }).status;
            const isTransient = status === 429 || status === 529 || status === 503;
            if (isTransient && attempt === 0) {
              await new Promise((r) => setTimeout(r, 2000));
              continue;
            }
            if (isTransient) break;
            throw err;
          }
        }
        if (response) break;
      }
    }

    if (!response) {
      throw lastError || new Error("All models failed for lab parsing. Check Anthropic API key and account status.");
    }

    // Parse extraction result
    const textContent = response.content.find((c) => c.type === "text");
    const rawText = textContent && "text" in textContent ? textContent.text : "";

    let parsedData: ParsedLabData | null = null;
    try {
      // Strip code fences if present
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]) as ParsedLabData;
      }
    } catch {
      // JSON may be truncated due to token limit — try to repair
      try {
        const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "");
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let truncated = jsonMatch[0];
          // Close any unclosed arrays/objects to salvage partial data
          const openBrackets = (truncated.match(/\[/g) || []).length;
          const closeBrackets = (truncated.match(/\]/g) || []).length;
          const openBraces = (truncated.match(/\{/g) || []).length;
          const closeBraces = (truncated.match(/\}/g) || []).length;
          // Trim trailing incomplete entry (after last comma)
          truncated = truncated.replace(/,\s*[^,\]\}]*$/, "");
          for (let i = 0; i < openBrackets - closeBrackets; i++) truncated += "]";
          for (let i = 0; i < openBraces - closeBraces; i++) truncated += "}";
          parsedData = JSON.parse(truncated) as ParsedLabData;
          console.log(`[Lab Parse] Repaired truncated JSON — salvaged ${parsedData?.biomarkers?.length || 0} biomarkers`);
        }
      } catch (repairErr) {
        console.error("[Lab Parse] JSON repair also failed:", repairErr);
        console.error("[Lab Parse] Raw text (first 500 chars):", rawText.slice(0, 500));
      }
    }

    if (!parsedData || !parsedData.biomarkers || parsedData.biomarkers.length === 0) {
      console.error("[Lab Parse] No biomarkers found. parsedData keys:", parsedData ? Object.keys(parsedData) : "null");
      console.error("[Lab Parse] Raw response (first 1000 chars):", rawText.slice(0, 1000));
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
      serviceClient,
      practitionerId
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
    const errorMessage = formatApiError(err);
    console.error("Lab parsing error:", errorMessage, err);

    await serviceClient
      .from("lab_reports")
      .update({
        status: "error",
        error_message: errorMessage,
      })
      .eq("id", reportId);
  }
}

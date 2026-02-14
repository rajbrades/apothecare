import { createServiceClient } from "@/lib/supabase/server";
import { createCompletion, getAnthropicClient, MODELS, ANTHROPIC_MODELS } from "./provider";
import { DOCUMENT_EXTRACTION_SYSTEM_PROMPT, EXTRACTION_SUMMARY_PROMPT } from "./document-extraction-prompts";
import { downloadFromStorage } from "@/lib/storage/patient-documents";
import { rebuildPatientClinicalSummary } from "./clinical-summary";

/**
 * Extract content from a patient document using AI vision.
 * This runs asynchronously (fire-and-forget from the upload endpoint).
 *
 * Uses Anthropic's document vision when available; falls back to
 * text-based extraction prompt for OpenAI provider.
 */
export async function extractDocumentContent(
  documentId: string,
  storagePath: string,
  practitionerId: string,
  patientId: string
): Promise<void> {
  const serviceClient = createServiceClient();

  try {
    // Update status to extracting
    await serviceClient
      .from("patient_documents")
      .update({ status: "extracting" })
      .eq("id", documentId);

    // Download PDF from storage
    let pdfBuffer: Buffer | null = await downloadFromStorage(storagePath);
    const base64Pdf = pdfBuffer.toString("base64");
    pdfBuffer = null; // FREE MEMORY IMMEDIATELY

    let rawText = "";

    // Try Anthropic document vision first (works with Anthropic/MiniMax)
    try {
      const anthropic = getAnthropicClient();
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODELS.vision,
        max_tokens: 8192,
        system: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
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
                text: "Extract all clinically relevant information from this patient document. Return valid JSON.",
              },
            ],
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      rawText = textContent && "text" in textContent ? textContent.text : "";
    } catch (visionError) {
      // If vision fails (e.g., OpenAI provider doesn't support document type),
      // the extraction cannot proceed without PDF content
      throw new Error(
        `Document vision extraction failed: ${visionError instanceof Error ? visionError.message : "Unknown error"}. PDF document extraction requires Anthropic API.`
      );
    }

    let extractedData: Record<string, unknown> = {};
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Store raw text if JSON parsing fails
    }

    // Generate a concise summary for visit context injection
    const summaryResult = await createCompletion({
      model: MODELS.standard,
      maxTokens: 1024,
      system: EXTRACTION_SUMMARY_PROMPT,
      messages: [
        {
          role: "user",
          content: `Summarize this extracted patient document data for clinical use:\n\n${JSON.stringify(extractedData, null, 2)}`,
        },
      ],
    });

    const extractionSummary = summaryResult.text;

    // Update document record
    await serviceClient
      .from("patient_documents")
      .update({
        status: "extracted",
        extracted_text: rawText,
        extracted_data: extractedData,
        extraction_summary: extractionSummary,
        extraction_model: ANTHROPIC_MODELS.vision,
        extracted_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", documentId);

    // Rebuild patient clinical summary
    await rebuildPatientClinicalSummary(patientId, practitionerId);

    // Audit log
    await serviceClient.from("audit_logs").insert({
      practitioner_id: practitionerId,
      action: "generate",
      resource_type: "patient_document",
      resource_id: documentId,
      detail: {
        patient_id: patientId,
        extraction_model: ANTHROPIC_MODELS.vision,
        has_structured_data: Object.keys(extractedData).length > 0,
      },
    });
  } catch (err) {
    console.error("Document extraction error:", err);

    await serviceClient
      .from("patient_documents")
      .update({
        status: "error",
        error_message: err instanceof Error ? err.message : "Extraction failed",
      })
      .eq("id", documentId);
  }
}

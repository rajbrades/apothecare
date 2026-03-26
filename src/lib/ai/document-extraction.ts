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

    // Auto-populate patient fields from extracted structured data
    await autoPopulateFromExtraction(patientId, extractedData, serviceClient);

    // Audit log (fire-and-forget)
    serviceClient.from("audit_logs").insert({
      practitioner_id: practitionerId,
      action: "generate",
      resource_type: "patient_document",
      resource_id: documentId,
      ip_address: "background",
      user_agent: "background",
      detail: {
        patient_id: patientId,
        extraction_model: ANTHROPIC_MODELS.vision,
        has_structured_data: Object.keys(extractedData).length > 0,
      },
    }).then(() => {}).catch((err: unknown) => {
      console.error("Audit log write failed:", err);
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

/**
 * Auto-populate patient record fields from extracted document data.
 * Merges new data into existing fields (doesn't overwrite non-empty fields).
 * Best-effort — errors are logged but don't fail the extraction.
 */
async function autoPopulateFromExtraction(
  patientId: string,
  extractedData: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: any
): Promise<void> {
  try {
    if (!extractedData || Object.keys(extractedData).length === 0) return;

    // Fetch current patient record to avoid overwriting existing data
    const { data: patient } = await serviceClient
      .from("patients")
      .select("id, practitioner_id, chief_complaints, medical_history, allergies, notes")
      .eq("id", patientId)
      .single();

    if (!patient) return;

    const updates: Record<string, unknown> = {};

    // Chief complaints — merge arrays (don't duplicate)
    if (Array.isArray(extractedData.chief_complaints) && extractedData.chief_complaints.length > 0) {
      const existing = new Set((patient.chief_complaints || []).map((c: string) => c.toLowerCase()));
      const newComplaints = (extractedData.chief_complaints as string[])
        .filter((c) => typeof c === "string" && !existing.has(c.toLowerCase()));
      if (newComplaints.length > 0) {
        updates.chief_complaints = [...(patient.chief_complaints || []), ...newComplaints].slice(0, 20);
      }
    }

    // Allergies — merge arrays
    if (Array.isArray(extractedData.allergies)) {
      const allergyNames = (extractedData.allergies as Array<string | { allergen: string }>)
        .map((a) => typeof a === "string" ? a : a?.allergen)
        .filter(Boolean);
      if (allergyNames.length > 0) {
        const existing = new Set((patient.allergies || []).map((a: string) => a.toLowerCase()));
        const newAllergies = allergyNames.filter((a) => !existing.has(a!.toLowerCase()));
        if (newAllergies.length > 0) {
          updates.allergies = [...(patient.allergies || []), ...newAllergies].slice(0, 50);
        }
      }
    }

    // Medical history — append if patient field is empty
    if (!patient.medical_history?.trim() && extractedData.medical_history) {
      const history = typeof extractedData.medical_history === "string"
        ? extractedData.medical_history
        : Array.isArray(extractedData.medical_history)
        ? (extractedData.medical_history as string[]).join("\n")
        : null;
      if (history) updates.medical_history = history;
    }

    if (Object.keys(updates).length > 0) {
      await serviceClient
        .from("patients")
        .update(updates)
        .eq("id", patientId);
      console.log(`[Auto-Populate] Updated ${Object.keys(updates).join(", ")} for patient ${patientId}`);
    }

    // Auto-populate structured medications into patient_medications table
    if (Array.isArray(extractedData.current_medications) && extractedData.current_medications.length > 0) {
      await populateMedicationsFromExtraction(
        patientId,
        patient.practitioner_id,
        extractedData.current_medications as Array<string | Record<string, string>>,
        serviceClient
      );
    }
  } catch (err) {
    console.warn("[Auto-Populate] Failed (non-blocking):", err);
  }
}

/**
 * Insert extracted medications into patient_medications table.
 * Skips duplicates by checking existing medication names (case-insensitive).
 */
async function populateMedicationsFromExtraction(
  patientId: string,
  practitionerId: string,
  medications: Array<string | Record<string, string>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: any
): Promise<void> {
  try {
    // Fetch existing medications to avoid duplicates
    const { data: existing } = await serviceClient
      .from("patient_medications")
      .select("name")
      .eq("patient_id", patientId);

    const existingNames = new Set(
      (existing || []).map((m: { name: string }) => m.name.toLowerCase())
    );

    const newMeds = medications
      .map((med) => {
        if (typeof med === "string") {
          return { name: med.trim(), dosage: null, frequency: null };
        }
        return {
          name: (med.name || "").trim(),
          dosage: med.dosage || med.dose || null,
          frequency: med.frequency || null,
        };
      })
      .filter((m) => m.name && !existingNames.has(m.name.toLowerCase()));

    if (newMeds.length === 0) return;

    const rows = newMeds.map((m, i) => ({
      patient_id: patientId,
      practitioner_id: practitionerId,
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      status: "active",
      source: "document_extracted",
      sort_order: (existing?.length || 0) + i,
    }));

    await serviceClient.from("patient_medications").insert(rows);
    console.log(`[Auto-Populate] Inserted ${rows.length} medications for patient ${patientId}`);
  } catch (err) {
    console.warn("[Auto-Populate] Medication insert failed (non-blocking):", err);
  }
}

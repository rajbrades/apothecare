import { createServiceClient } from "@/lib/supabase/server";
import type { PatientClinicalSummary } from "@/types/database";

/**
 * Rebuild a patient's clinical_summary JSONB from all extracted documents.
 * Called after a document is extracted or deleted.
 */
export async function rebuildPatientClinicalSummary(
  patientId: string,
  _practitionerId: string
): Promise<void> {
  const serviceClient = createServiceClient();

  // Fetch all extracted documents for this patient
  const { data: documents } = await serviceClient
    .from("patient_documents")
    .select("extracted_data, extraction_summary, document_type, title, document_date")
    .eq("patient_id", patientId)
    .eq("status", "extracted")
    .order("document_date", { ascending: false, nullsFirst: false });

  if (!documents || documents.length === 0) {
    // No extracted documents — clear summary
    await serviceClient
      .from("patients")
      .update({ clinical_summary: {} })
      .eq("id", patientId);
    return;
  }

  // Aggregate findings from all documents
  const allMedications: string[] = [];
  const allSupplements: string[] = [];
  const allAllergies: string[] = [];
  const allFindings: string[] = [];
  const summaryParts: string[] = [];

  for (const doc of documents) {
    const data = doc.extracted_data as Record<string, unknown>;

    // Collect medications
    if (Array.isArray(data.current_medications)) {
      for (const med of data.current_medications) {
        const name = typeof med === "string" ? med : (med as Record<string, string>)?.name;
        if (name && !allMedications.includes(name)) allMedications.push(name);
      }
    }

    // Collect supplements
    if (Array.isArray(data.current_supplements)) {
      for (const sup of data.current_supplements) {
        const name = typeof sup === "string" ? sup : (sup as Record<string, string>)?.name;
        if (name && !allSupplements.includes(name)) allSupplements.push(name);
      }
    }

    // Collect allergies
    if (Array.isArray(data.allergies)) {
      for (const allergy of data.allergies) {
        const name = typeof allergy === "string" ? allergy : (allergy as Record<string, string>)?.allergen;
        if (name && !allAllergies.includes(name)) allAllergies.push(name);
      }
    }

    // Collect chief complaints as key findings
    if (Array.isArray(data.chief_complaints)) {
      for (const cc of data.chief_complaints) {
        if (typeof cc === "string" && !allFindings.includes(cc)) allFindings.push(cc);
      }
    }

    // Include extraction summaries
    if (doc.extraction_summary) {
      const label = doc.title || doc.document_type || "Document";
      summaryParts.push(`[${label}]\n${doc.extraction_summary}`);
    }
  }

  const clinicalSummary: PatientClinicalSummary = {
    intake_summary: summaryParts.join("\n\n---\n\n"),
    key_findings: allFindings.slice(0, 20),
    medications_from_docs: allMedications,
    supplements_from_docs: allSupplements,
    allergies_from_docs: allAllergies,
    document_count: documents.length,
    last_updated: new Date().toISOString(),
  };

  await serviceClient
    .from("patients")
    .update({ clinical_summary: clinicalSummary })
    .eq("id", patientId);
}

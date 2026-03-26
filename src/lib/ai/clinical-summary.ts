import { createServiceClient } from "@/lib/supabase/server";
import { createCompletion, MODELS } from "./provider";
import type { PatientClinicalSummary } from "@/types/database";

// ---------------------------------------------------------------------------
// System prompt for AI-synthesized pre-chart narrative
// ---------------------------------------------------------------------------
const SYNTHESIS_SYSTEM_PROMPT = `You are a clinical documentation specialist for a functional medicine practice. Your task is to synthesize ALL patient data sources into ONE cohesive clinical pre-chart narrative.

OUTPUT FORMAT — Return valid JSON matching this exact structure:
{
  "narrative": "A 2-4 paragraph clinical narrative organized by: demographics & chief concerns → medical/surgical history → current treatment (medications + supplements) → notable findings → current status & treatment direction. Write in third-person clinical voice. Deduplicate information that appears in multiple sources — each fact should appear exactly once. Include dates when available.",
  "key_findings": ["Up to 10 clinically significant findings, deduplicated, ordered by importance"],
  "medications": ["Medication Name (dose, frequency)"],
  "supplements": ["Supplement Name (dose)"],
  "allergies": ["Allergen — reaction if known"]
}

RULES:
- Deduplicate aggressively. If the same medication, allergy, or finding appears in multiple documents, include it only ONCE.
- Prefer the most recent/detailed version when information conflicts across documents.
- Include encounter/visit data alongside document data — visits provide the most current clinical picture.
- For medications and supplements, include dosage when available.
- The narrative should read as a single cohesive pre-chart brief, NOT as a list of document summaries.
- Do NOT include the JSON keys in the narrative text itself.
- Return ONLY the JSON object, no markdown fencing.`;

// ---------------------------------------------------------------------------
// Gather raw data from all sources
// ---------------------------------------------------------------------------
interface RawSourceData {
  documents: Array<{
    title: string;
    date: string | null;
    type: string;
    extractedData: Record<string, unknown>;
    summary: string | null;
  }>;
  visits: Array<{
    date: string;
    type: string;
    chiefComplaint: string | null;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  }>;
  sourceCount: number;
}

async function gatherSourceData(patientId: string): Promise<RawSourceData> {
  const serviceClient = createServiceClient();

  // Fetch extracted documents
  const { data: documents } = await serviceClient
    .from("patient_documents")
    .select("extracted_data, extraction_summary, document_type, title, document_date")
    .eq("patient_id", patientId)
    .eq("status", "extracted")
    .order("document_date", { ascending: false, nullsFirst: false });

  // Fetch completed visits with SOAP data
  const { data: visits } = await serviceClient
    .from("visits")
    .select("visit_date, visit_type, chief_complaint, subjective, objective, assessment, plan")
    .eq("patient_id", patientId)
    .eq("status", "completed")
    .order("visit_date", { ascending: false })
    .limit(10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docSources = (documents || []).map((doc: any) => ({
    title: doc.title || doc.document_type || "Document",
    date: doc.document_date,
    type: doc.document_type || "unknown",
    extractedData: (doc.extracted_data || {}) as Record<string, unknown>,
    summary: doc.extraction_summary,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visitSources = (visits || []).map((v: any) => ({
    date: v.visit_date,
    type: v.visit_type || "visit",
    chiefComplaint: v.chief_complaint,
    subjective: v.subjective,
    objective: v.objective,
    assessment: v.assessment,
    plan: v.plan,
  }));

  return {
    documents: docSources,
    visits: visitSources,
    sourceCount: docSources.length + visitSources.length,
  };
}

// ---------------------------------------------------------------------------
// Format source data into a prompt for AI synthesis
// ---------------------------------------------------------------------------
function buildSynthesisPrompt(data: RawSourceData): string {
  const parts: string[] = [];

  // Documents
  for (const doc of data.documents) {
    parts.push(`=== DOCUMENT: ${doc.title} (${doc.date || "undated"}) ===`);
    if (doc.summary) parts.push(doc.summary);

    const d = doc.extractedData;
    if (Array.isArray(d.chief_complaints) && d.chief_complaints.length)
      parts.push(`Chief Complaints: ${d.chief_complaints.join(", ")}`);
    if (d.medical_history && (Array.isArray(d.medical_history) ? d.medical_history.length : true))
      parts.push(`Medical History: ${Array.isArray(d.medical_history) ? d.medical_history.join("; ") : d.medical_history}`);
    if (Array.isArray(d.current_medications) && d.current_medications.length)
      parts.push(`Medications: ${d.current_medications.map((m: any) => typeof m === "string" ? m : `${m.name || ""} ${m.dosage || ""} ${m.frequency || ""}`.trim()).join(", ")}`);
    if (Array.isArray(d.current_supplements) && d.current_supplements.length)
      parts.push(`Supplements: ${d.current_supplements.map((s: any) => typeof s === "string" ? s : `${s.name || ""} ${s.dosage || ""}`.trim()).join(", ")}`);
    if (Array.isArray(d.allergies) && d.allergies.length)
      parts.push(`Allergies: ${d.allergies.map((a: any) => typeof a === "string" ? a : `${a.allergen || ""} (${a.reaction || "unknown reaction"})`).join(", ")}`);
    if (Array.isArray(d.symptoms) && d.symptoms.length)
      parts.push(`Symptoms: ${d.symptoms.map((s: any) => typeof s === "string" ? s : s.symptom || "").join(", ")}`);
    if (d.lifestyle && typeof d.lifestyle === "object") {
      const ls = d.lifestyle as Record<string, unknown>;
      const lifestyleParts = Object.entries(ls).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
      if (lifestyleParts.length) parts.push(`Lifestyle: ${lifestyleParts.join("; ")}`);
    }
    if (Array.isArray(d.goals) && d.goals.length)
      parts.push(`Goals: ${d.goals.join(", ")}`);
    parts.push("");
  }

  // Visits
  for (const visit of data.visits) {
    const date = new Date(visit.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    parts.push(`=== VISIT: ${visit.type?.replace(/_/g, " ")} (${date}) ===`);
    if (visit.chiefComplaint) parts.push(`Chief Complaint: ${visit.chiefComplaint}`);
    if (visit.subjective) parts.push(`Subjective: ${visit.subjective}`);
    if (visit.objective) parts.push(`Objective: ${visit.objective}`);
    if (visit.assessment) parts.push(`Assessment: ${visit.assessment}`);
    if (visit.plan) parts.push(`Plan: ${visit.plan}`);
    parts.push("");
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Quick aggregation fallback (no AI, for auto-rebuild after extraction)
// ---------------------------------------------------------------------------
function quickAggregate(data: RawSourceData): PatientClinicalSummary {
  const allMedications: string[] = [];
  const allSupplements: string[] = [];
  const allAllergies: string[] = [];
  const allFindings: string[] = [];
  const summaryParts: string[] = [];

  for (const doc of data.documents) {
    const d = doc.extractedData;
    if (Array.isArray(d.current_medications)) {
      for (const med of d.current_medications) {
        const name = typeof med === "string" ? med : (med as Record<string, string>)?.name;
        if (name && !allMedications.includes(name)) allMedications.push(name);
      }
    }
    if (Array.isArray(d.current_supplements)) {
      for (const sup of d.current_supplements) {
        const name = typeof sup === "string" ? sup : (sup as Record<string, string>)?.name;
        if (name && !allSupplements.includes(name)) allSupplements.push(name);
      }
    }
    if (Array.isArray(d.allergies)) {
      for (const allergy of d.allergies) {
        const name = typeof allergy === "string" ? allergy : (allergy as Record<string, string>)?.allergen;
        if (name && !allAllergies.includes(name)) allAllergies.push(name);
      }
    }
    if (Array.isArray(d.chief_complaints)) {
      for (const cc of d.chief_complaints) {
        if (typeof cc === "string" && !allFindings.includes(cc)) allFindings.push(cc);
      }
    }
    if (doc.summary) {
      summaryParts.push(`[${doc.title}]\n${doc.summary}`);
    }
  }

  // Also pull chief complaints from visits
  for (const visit of data.visits) {
    if (visit.chiefComplaint && !allFindings.includes(visit.chiefComplaint)) {
      allFindings.push(visit.chiefComplaint);
    }
  }

  return {
    intake_summary: summaryParts.join("\n\n---\n\n"),
    key_findings: allFindings.slice(0, 20),
    medications_from_docs: allMedications,
    supplements_from_docs: allSupplements,
    allergies_from_docs: allAllergies,
    document_count: data.documents.length,
    visit_count: data.visits.length,
    last_updated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Rebuild a patient's clinical_summary from all extracted documents + visits.
 *
 * When `useAI` is true (manual re-synthesis), sends all data to Claude for a
 * cohesive clinical narrative. When false (auto-rebuild after extraction),
 * uses fast aggregation without an AI call.
 */
export async function rebuildPatientClinicalSummary(
  patientId: string,
  _practitionerId: string,
  options?: { useAI?: boolean }
): Promise<void> {
  const serviceClient = createServiceClient();
  const data = await gatherSourceData(patientId);

  if (data.sourceCount === 0) {
    await serviceClient
      .from("patients")
      .update({ clinical_summary: {} })
      .eq("id", patientId);
    return;
  }

  // Fast path: auto-rebuild after extraction (no AI call)
  if (!options?.useAI) {
    const summary = quickAggregate(data);
    await serviceClient
      .from("patients")
      .update({ clinical_summary: summary })
      .eq("id", patientId);
    return;
  }

  // AI synthesis path
  const sourceText = buildSynthesisPrompt(data);

  try {
    const result = await createCompletion({
      model: MODELS.standard,
      maxTokens: 4096,
      system: SYNTHESIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Synthesize the following patient data into a single cohesive pre-chart clinical narrative.\n\nSOURCES (${data.documents.length} documents, ${data.visits.length} visits):\n\n${sourceText}`,
        },
      ],
    });

    const raw = result.text.trim();
    // Strip markdown fencing if present
    const jsonStr = raw.startsWith("```") ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "") : raw;
    const parsed = JSON.parse(jsonStr);

    const clinicalSummary: PatientClinicalSummary = {
      intake_summary: parsed.narrative || "",
      key_findings: Array.isArray(parsed.key_findings) ? parsed.key_findings.slice(0, 15) : [],
      medications_from_docs: Array.isArray(parsed.medications) ? parsed.medications : [],
      supplements_from_docs: Array.isArray(parsed.supplements) ? parsed.supplements : [],
      allergies_from_docs: Array.isArray(parsed.allergies) ? parsed.allergies : [],
      document_count: data.documents.length,
      visit_count: data.visits.length,
      last_updated: new Date().toISOString(),
    };

    await serviceClient
      .from("patients")
      .update({ clinical_summary: clinicalSummary })
      .eq("id", patientId);
  } catch (err) {
    console.error("[Clinical Summary] AI synthesis failed, falling back to aggregation:", err);
    // Fallback to quick aggregation
    const summary = quickAggregate(data);
    await serviceClient
      .from("patients")
      .update({ clinical_summary: summary })
      .eq("id", patientId);
  }
}

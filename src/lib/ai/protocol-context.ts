// ==========================================================================
// APOTHECARE - Protocol Generator Pro: Clinical Context Assembly
// ==========================================================================
// Assembles all patient clinical data needed for AI protocol generation.
// Follows the parallel Promise.all query pattern from patients/[id]/page.tsx.

import { retrieveContext } from "@/lib/rag/retrieve";
import { formatRagContext } from "@/lib/rag/format-context";

// ── Types ────────────────────────────────────────────────────────────────

export interface ProtocolGenerationContext {
  patient: {
    name: string;
    age: number | null;
    sex: string | null;
    chief_complaints: string[];
  };
  clinicalSummary: string | null;
  visits: {
    date: string;
    visit_type: string;
    soap: Record<string, unknown>;
  }[];
  biomarkers: {
    name: string;
    value: number;
    unit: string;
    flag: string | null;
    date: string;
  }[];
  supplements: {
    name: string;
    dosage: string | null;
    frequency: string | null;
  }[];
  medications: {
    name: string;
    dosage: string | null;
    frequency: string | null;
  }[];
  symptomScores: {
    date: string;
    total_score: number;
    scores: Record<string, number>;
  }[];
  ifmMatrix: Record<string, unknown> | null;
  ragContext: string;
  focusAreas: string[];
  customInstructions: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function computeAge(dob: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  return Math.floor(
    (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

function computeTotalScore(scores: Record<string, number>): number {
  const values = Object.values(scores).filter(
    (v) => typeof v === "number" && !isNaN(v)
  );
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0);
}

/**
 * Build a semantic search query from focus areas and chief complaints
 * to retrieve relevant partnership RAG content.
 */
function buildRagQuery(
  focusAreas: string[],
  chiefComplaints: string[]
): string {
  const parts: string[] = [];

  if (focusAreas.length > 0) {
    parts.push(`functional medicine protocol for ${focusAreas.join(", ")}`);
  }

  if (chiefComplaints.length > 0) {
    parts.push(`treatment protocol for ${chiefComplaints.join(", ")}`);
  }

  // Fallback if both are empty
  if (parts.length === 0) {
    parts.push("functional medicine treatment protocol supplements");
  }

  return parts.join("; ");
}

// ── Main Assembly Function ───────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Assemble all clinical data needed for AI protocol generation.
 *
 * Fetches patient demographics, visits, biomarkers, supplements,
 * medications, symptom scores, IFM matrix data, clinical summary,
 * and partnership RAG context — all in parallel where possible.
 */
export async function assembleProtocolContext(
  supabase: any,
  patientId: string,
  practitionerId: string,
  focusAreas: string[],
  customInstructions?: string
): Promise<ProtocolGenerationContext> {
  // Six months ago for biomarker date filtering
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString().split("T")[0];

  // ── Phase 1: Parallel data fetch ──────────────────────────────────

  const [
    { data: patient },
    { data: visits },
    { data: biomarkersRecent },
    { data: biomarkersFlagged },
    { data: supplements },
    { data: medications },
    { data: symptomSnapshots },
    { data: partnershipRows },
  ] = await Promise.all([
    // 1. Patient demographics, intake, clinical summary, IFM matrix
    supabase
      .from("patients")
      .select(
        "first_name, last_name, date_of_birth, sex, chief_complaints, " +
        "medical_history, current_medications, supplements, allergies, " +
        "clinical_summary, ifm_matrix, diagnoses, health_goals, " +
        "genetic_testing, apoe_genotype, mthfr_variants"
      )
      .eq("id", patientId)
      .eq("practitioner_id", practitionerId)
      .single(),

    // 2. Completed visits — most recent 10
    supabase
      .from("visits")
      .select(
        "visit_date, visit_type, chief_complaint, subjective, objective, assessment, plan"
      )
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitionerId)
      .eq("status", "completed")
      .eq("is_archived", false)
      .order("visit_date", { ascending: false })
      .limit(10),

    // 3a. Biomarkers from last 6 months (regardless of flag)
    supabase
      .from("biomarker_results")
      .select(
        "biomarker_name, value, unit, functional_flag, conventional_flag, " +
        "lab_reports!inner(patient_id, collection_date)"
      )
      .eq("lab_reports.patient_id", patientId)
      .gte("lab_reports.collection_date", sixMonthsAgoISO)
      .order("lab_reports(collection_date)", { ascending: false })
      .limit(100),

    // 3b. Flagged biomarkers (any date) — catch older abnormals
    supabase
      .from("biomarker_results")
      .select(
        "biomarker_name, value, unit, functional_flag, conventional_flag, " +
        "lab_reports!inner(patient_id, collection_date)"
      )
      .eq("lab_reports.patient_id", patientId)
      .not("functional_flag", "in", "(optimal,normal)")
      .order("lab_reports(collection_date)", { ascending: false })
      .limit(50),

    // 4. Active supplements
    supabase
      .from("patient_supplements")
      .select("name, dosage, frequency, form, timing, brand")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitionerId)
      .eq("status", "active")
      .order("sort_order", { ascending: true }),

    // 5. Active medications
    supabase
      .from("patient_medications")
      .select("name, dosage, frequency, route, indication")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitionerId)
      .neq("status", "discontinued")
      .order("sort_order", { ascending: true }),

    // 6. Symptom score snapshots — last 5
    supabase
      .from("symptom_score_snapshots")
      .select("scores, recorded_at, source")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false })
      .limit(5),

    // 7. Practitioner partnerships (for RAG context)
    supabase
      .from("practitioner_partnerships")
      .select("partnership_id")
      .eq("practitioner_id", practitionerId)
      .eq("is_active", true),
  ]);

  // ── Phase 2: Merge and deduplicate biomarkers ─────────────────────

  const biomarkerMap = new Map<
    string,
    { name: string; value: number; unit: string; flag: string | null; date: string }
  >();

  const processBiomarkers = (rows: any[] | null) => {
    if (!rows) return;
    for (const b of rows) {
      const date = b.lab_reports?.collection_date || "";
      const key = `${b.biomarker_name}::${date}`;
      if (!biomarkerMap.has(key)) {
        // Prefer functional_flag, fallback to conventional_flag
        const flag = b.functional_flag || b.conventional_flag || null;
        biomarkerMap.set(key, {
          name: b.biomarker_name,
          value: b.value,
          unit: b.unit || "",
          flag,
          date,
        });
      }
    }
  };

  processBiomarkers(biomarkersRecent);
  processBiomarkers(biomarkersFlagged);

  const biomarkers = Array.from(biomarkerMap.values()).sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  // ── Phase 3: RAG context retrieval ────────────────────────────────

  let ragContext = "";
  const partnershipIds = (partnershipRows || []).map(
    (r: any) => r.partnership_id
  );

  if (partnershipIds.length > 0) {
    const chiefComplaints = patient?.chief_complaints || [];
    const ragQuery = buildRagQuery(focusAreas, chiefComplaints);

    try {
      const chunks = await retrieveContext({
        query: ragQuery,
        partnershipIds,
        maxChunks: 8,
        threshold: 0.62, // Slightly lower threshold for broader protocol context
      });

      if (chunks.length > 0) {
        ragContext = formatRagContext(chunks);
      }
    } catch (err) {
      console.error("[Protocol Context] RAG retrieval failed:", err);
      // Non-fatal — proceed without RAG context
    }
  }

  // ── Phase 4: Assemble context ─────────────────────────────────────

  // Extract clinical summary narrative
  const summary = patient?.clinical_summary as Record<string, unknown> | null;
  let clinicalSummary: string | null = null;
  if (summary?.intake_summary && typeof summary.intake_summary === "string") {
    clinicalSummary = summary.intake_summary;
  }

  // Format visits
  const formattedVisits = (visits || []).map((v: any) => ({
    date: v.visit_date,
    visit_type: v.visit_type || "soap",
    soap: {
      chief_complaint: v.chief_complaint || null,
      subjective: v.subjective || null,
      objective: v.objective || null,
      assessment: v.assessment || null,
      plan: v.plan || null,
    },
  }));

  // Format supplements — prefer structured data, fallback to patient.supplements text
  let formattedSupplements: ProtocolGenerationContext["supplements"] = [];
  if (supplements && supplements.length > 0) {
    formattedSupplements = supplements.map((s: any) => ({
      name: s.name,
      dosage: s.dosage || null,
      frequency: s.frequency || null,
    }));
  } else if (patient?.supplements && typeof patient.supplements === "string") {
    // Parse freeform text — each line or comma-separated entry
    formattedSupplements = patient.supplements
      .split(/[,\n]+/)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .map((s: string) => ({ name: s, dosage: null, frequency: null }));
  }

  // Format medications — prefer structured data, fallback to patient.current_medications text
  let formattedMedications: ProtocolGenerationContext["medications"] = [];
  if (medications && medications.length > 0) {
    formattedMedications = medications.map((m: any) => ({
      name: m.name,
      dosage: m.dosage || null,
      frequency: m.frequency || null,
    }));
  } else if (
    patient?.current_medications &&
    typeof patient.current_medications === "string"
  ) {
    formattedMedications = patient.current_medications
      .split(/[,\n]+/)
      .map((m: string) => m.trim())
      .filter(Boolean)
      .map((m: string) => ({ name: m, dosage: null, frequency: null }));
  }

  // Format symptom snapshots
  const formattedSymptomScores = (symptomSnapshots || []).map((s: any) => {
    const scores = (s.scores || {}) as Record<string, number>;
    return {
      date: s.recorded_at,
      total_score: computeTotalScore(scores),
      scores,
    };
  });

  // IFM Matrix
  const ifmMatrix =
    patient?.ifm_matrix && typeof patient.ifm_matrix === "object"
      ? (patient.ifm_matrix as Record<string, unknown>)
      : null;

  return {
    patient: {
      name: [patient?.first_name, patient?.last_name]
        .filter(Boolean)
        .join(" ") || "Unknown",
      age: computeAge(patient?.date_of_birth ?? null),
      sex: patient?.sex || null,
      chief_complaints: patient?.chief_complaints || [],
    },
    clinicalSummary,
    visits: formattedVisits,
    biomarkers,
    supplements: formattedSupplements,
    medications: formattedMedications,
    symptomScores: formattedSymptomScores,
    ifmMatrix,
    ragContext,
    focusAreas,
    customInstructions: customInstructions || null,
  };
}

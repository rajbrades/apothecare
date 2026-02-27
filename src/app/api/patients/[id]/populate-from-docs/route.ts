import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { auditLog } from "@/lib/api/audit";
import { createCompletion, MODELS } from "@/lib/ai/provider";
import { mergeIFMMatrix } from "@/lib/ifm/merge";
import {
  MEDICAL_HISTORY_PROMPT,
  CLINICAL_NOTES_PROMPT,
  IFM_MATRIX_FROM_DOCS_PROMPT,
} from "@/lib/ai/populate-prompts";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 120;

const POPULATE_SECTIONS = [
  "chief_complaints",
  "medical_history",
  "current_medications",
  "allergies",
  "notes",
  "ifm_matrix",
] as const;

type PopulateSection = (typeof POPULATE_SECTIONS)[number];

const AI_SECTIONS: PopulateSection[] = ["medical_history", "notes", "ifm_matrix"];

const bodySchema = z.object({
  sections: z
    .array(z.enum(POPULATE_SECTIONS))
    .min(1, "Select at least one section"),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── Aggregation helpers ────────────────────────────────────────────────

interface ExtractedData {
  chief_complaints?: unknown[];
  medical_history?: unknown[];
  surgical_history?: unknown[];
  family_history?: unknown[];
  current_medications?: unknown[];
  allergies?: unknown[];
  symptoms?: unknown[];
  lifestyle?: Record<string, unknown>;
  goals?: unknown[];
  social_history?: unknown;
  review_of_systems?: Record<string, unknown>;
  [key: string]: unknown;
}

function aggregateDocuments(documents: { extracted_data: Record<string, unknown> }[]) {
  const chiefComplaints = new Set<string>();
  const allergies = new Set<string>();
  const medications = new Map<string, { name: string; dosage?: string; frequency?: string }>();
  const medicalHistory: string[] = [];
  const surgicalHistory: string[] = [];
  const familyHistory: string[] = [];
  const symptoms: unknown[] = [];
  const lifestyleEntries: Record<string, unknown>[] = [];
  const goals: string[] = [];
  const socialHistory: string[] = [];
  const reviewOfSystems: Record<string, unknown>[] = [];

  for (const doc of documents) {
    const data = doc.extracted_data as ExtractedData;

    if (Array.isArray(data.chief_complaints)) {
      for (const cc of data.chief_complaints) {
        if (typeof cc === "string" && cc.trim()) chiefComplaints.add(cc.trim());
      }
    }

    if (Array.isArray(data.allergies)) {
      for (const a of data.allergies) {
        const name = typeof a === "string" ? a : (a as Record<string, string>)?.allergen;
        if (name?.trim()) allergies.add(name.trim());
      }
    }

    if (Array.isArray(data.current_medications)) {
      for (const med of data.current_medications) {
        const m = typeof med === "string" ? { name: med } : (med as Record<string, string>);
        if (m?.name && !medications.has(m.name.toLowerCase().trim())) {
          medications.set(m.name.toLowerCase().trim(), {
            name: m.name.trim(),
            dosage: m.dosage?.trim(),
            frequency: m.frequency?.trim(),
          });
        }
      }
    }

    if (Array.isArray(data.medical_history)) {
      for (const h of data.medical_history) {
        if (typeof h === "string" && h.trim()) medicalHistory.push(h.trim());
        else if (h && typeof h === "object") medicalHistory.push(JSON.stringify(h));
      }
    }

    if (Array.isArray(data.surgical_history)) {
      for (const s of data.surgical_history) {
        if (typeof s === "string" && s.trim()) surgicalHistory.push(s.trim());
        else if (s && typeof s === "object") surgicalHistory.push(JSON.stringify(s));
      }
    }

    if (Array.isArray(data.family_history)) {
      for (const f of data.family_history) {
        if (typeof f === "string" && f.trim()) familyHistory.push(f.trim());
        else if (f && typeof f === "object") familyHistory.push(JSON.stringify(f));
      }
    }

    if (Array.isArray(data.symptoms)) symptoms.push(...data.symptoms);
    if (data.lifestyle && typeof data.lifestyle === "object") lifestyleEntries.push(data.lifestyle);
    if (Array.isArray(data.goals)) {
      for (const g of data.goals) {
        if (typeof g === "string" && g.trim()) goals.push(g.trim());
      }
    }
    if (typeof data.social_history === "string" && data.social_history.trim()) {
      socialHistory.push(data.social_history.trim());
    }
    if (data.review_of_systems && typeof data.review_of_systems === "object") {
      reviewOfSystems.push(data.review_of_systems);
    }
  }

  return {
    chiefComplaints: [...chiefComplaints],
    allergies: [...allergies],
    medications: [...medications.values()],
    medicalHistory,
    surgicalHistory,
    familyHistory,
    symptoms,
    lifestyleEntries,
    goals,
    socialHistory,
    reviewOfSystems,
  };
}

function formatMedications(
  meds: { name: string; dosage?: string; frequency?: string }[]
): string {
  return meds
    .map((m) => [m.name, m.dosage, m.frequency].filter(Boolean).join(", "))
    .join("\n");
}

// ── POST /api/patients/[id]/populate-from-docs ─────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { sections } = parsed.data;
    const needsAI = sections.some((s) => AI_SECTIONS.includes(s));

    // Rate limit only when AI is involved
    if (needsAI) {
      const rateLimitError = await checkRateLimit(
        supabase,
        practitioner.id,
        practitioner.subscription_tier,
        "doc_populate"
      );
      if (rateLimitError) return rateLimitError;
    }

    // Verify patient ownership
    const { data: patient } = await supabase
      .from("patients")
      .select("id, ifm_matrix")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!patient) return jsonError("Patient not found", 404);

    // Fetch extracted documents (newest 10)
    const { data: documents } = await supabase
      .from("patient_documents")
      .select("extracted_data")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .eq("status", "extracted")
      .order("document_date", { ascending: false, nullsFirst: false })
      .limit(10);

    if (!documents || documents.length === 0) {
      return jsonError("No extracted documents found", 400);
    }

    const agg = aggregateDocuments(documents);
    const populated: Record<string, unknown> = {};
    const aiTasks: Promise<void>[] = [];

    // ── Direct aggregation sections ──────────────────────────────────

    if (sections.includes("chief_complaints") && agg.chiefComplaints.length > 0) {
      populated.chief_complaints = agg.chiefComplaints.slice(0, 20);
    }

    if (sections.includes("allergies") && agg.allergies.length > 0) {
      populated.allergies = agg.allergies.slice(0, 50);
    }

    if (sections.includes("current_medications") && agg.medications.length > 0) {
      populated.current_medications = formatMedications(agg.medications);
    }

    // ── AI synthesis sections (run in parallel) ──────────────────────

    if (sections.includes("medical_history")) {
      const hasData =
        agg.medicalHistory.length > 0 ||
        agg.surgicalHistory.length > 0 ||
        agg.familyHistory.length > 0;

      if (hasData) {
        aiTasks.push(
          createCompletion({
            model: MODELS.standard,
            maxTokens: 1500,
            system: MEDICAL_HISTORY_PROMPT,
            messages: [
              {
                role: "user",
                content: JSON.stringify({
                  medical_history: agg.medicalHistory,
                  surgical_history: agg.surgicalHistory,
                  family_history: agg.familyHistory,
                }),
              },
            ],
          }).then((result) => {
            populated.medical_history = result.text.trim();
          })
        );
      }
    }

    if (sections.includes("notes")) {
      const hasData =
        agg.symptoms.length > 0 ||
        agg.lifestyleEntries.length > 0 ||
        agg.goals.length > 0 ||
        agg.socialHistory.length > 0 ||
        agg.reviewOfSystems.length > 0;

      if (hasData) {
        aiTasks.push(
          createCompletion({
            model: MODELS.standard,
            maxTokens: 2000,
            system: CLINICAL_NOTES_PROMPT,
            messages: [
              {
                role: "user",
                content: JSON.stringify({
                  symptoms: agg.symptoms,
                  lifestyle: agg.lifestyleEntries,
                  goals: agg.goals,
                  social_history: agg.socialHistory,
                  review_of_systems: agg.reviewOfSystems,
                }),
              },
            ],
          }).then((result) => {
            populated.notes = result.text.trim();
          })
        );
      }
    }

    if (sections.includes("ifm_matrix")) {
      // Build comprehensive context for IFM mapping
      const context = {
        chief_complaints: agg.chiefComplaints,
        medical_history: agg.medicalHistory,
        medications: agg.medications,
        allergies: agg.allergies,
        symptoms: agg.symptoms,
        lifestyle: agg.lifestyleEntries,
        review_of_systems: agg.reviewOfSystems,
      };

      const hasData = Object.values(context).some(
        (v) => Array.isArray(v) && v.length > 0
      );

      if (hasData) {
        aiTasks.push(
          createCompletion({
            model: MODELS.standard,
            maxTokens: 2000,
            system: IFM_MATRIX_FROM_DOCS_PROMPT,
            messages: [
              {
                role: "user",
                content: `Patient clinical data from ${documents.length} document(s):\n\n${JSON.stringify(context, null, 2)}`,
              },
            ],
          }).then((result) => {
            try {
              const raw = result.text.replace(/```json\n?|\n?```/g, "").trim();
              const parsed = JSON.parse(raw);
              populated.ifm_matrix = mergeIFMMatrix(patient.ifm_matrix, parsed);
            } catch {
              console.error("Failed to parse IFM matrix response");
            }
          })
        );
      }
    }

    // Wait for all AI tasks
    if (aiTasks.length > 0) {
      await Promise.all(aiTasks);
    }

    // Nothing was populated
    if (Object.keys(populated).length === 0) {
      return jsonError("No data found in documents for the selected sections", 400);
    }

    // Update patient record
    const { error: updateError } = await supabase
      .from("patients")
      .update(populated)
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id);

    if (updateError) {
      console.error("Patient update error:", updateError);
      return jsonError("Failed to update patient", 500);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "patient",
      resourceId: patientId,
      detail: {
        action: "populate_from_docs",
        sections: Object.keys(populated),
        document_count: documents.length,
        ai_used: needsAI,
      },
    });

    return NextResponse.json({
      populated,
      document_count: documents.length,
    });
  } catch (err) {
    console.error("Populate from docs error:", err);
    return jsonError("Internal server error", 500);
  }
}

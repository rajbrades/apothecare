import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { createCompletion, MODELS } from "@/lib/ai/provider";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

interface SynthesisResult {
  summary: string;
  key_trends: string[];
  correlations: string[];
  potential_root_causes: string[];
  bright_spots: string[];
  focus_areas: string[];
}

// ── POST /api/patients/[id]/timeline/analyze ─────────────────────────────
// Gathers all available clinical data for the patient, sends it to Claude,
// and upserts an 'ai_insight' timeline event with the structured result.
// Idempotent: re-running updates the existing ai_insight event.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // ── 1. Gather clinical context (parallel) ─────────────────────────

    const [
      patientResult,
      timelineResult,
      visitsResult,
      biomarkersResult,
      supplementsResult,
    ] = await Promise.all([
      // Patient demographics + chief complaints
      supabase
        .from("patients")
        .select("first_name, last_name, date_of_birth, sex, chief_complaints, medical_history")
        .eq("id", patientId)
        .eq("practitioner_id", practitioner.id)
        .single(),

      // Last 25 timeline events
      supabase
        .from("timeline_events")
        .select("title, summary, event_type, event_date")
        .eq("patient_id", patientId)
        .eq("practitioner_id", practitioner.id)
        .neq("event_type", "ai_insight")
        .order("event_date", { ascending: false })
        .limit(25),

      // Vitals + health ratings from visits
      supabase
        .from("visits")
        .select("visit_date, vitals_data, health_ratings, chief_complaint, assessment")
        .eq("patient_id", patientId)
        .eq("practitioner_id", practitioner.id)
        .or("vitals_data.not.is.null,health_ratings.not.is.null")
        .order("visit_date", { ascending: false })
        .limit(10),

      // Flagged biomarkers from last 90 days
      supabase
        .from("biomarker_results")
        .select("biomarker_name, value, unit, functional_flag, conventional_flag, category, collection_date")
        .eq("patient_id", patientId)
        .not("functional_flag", "in", '("optimal","normal")')
        .gte("collection_date", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().split("T")[0])
        .order("collection_date", { ascending: false })
        .limit(30),

      // Active supplements
      supabase
        .from("patient_supplements")
        .select("name, dosage, form, timing, notes")
        .eq("patient_id", patientId)
        .eq("practitioner_id", practitioner.id)
        .eq("status", "active")
        .limit(20),
    ]);

    if (!patientResult.data) return jsonError("Patient not found", 404);
    const patient = patientResult.data;

    // ── 2. Build context string ───────────────────────────────────────

    const name = [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "Patient";
    const age = patient.date_of_birth
      ? `${Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))} years old`
      : "Age unknown";

    const contextParts: string[] = [
      `Patient: ${name}, ${age}, ${patient.sex || "sex unspecified"}`,
    ];

    if (patient.chief_complaints?.length) {
      contextParts.push(`Chief Complaints: ${patient.chief_complaints.join(", ")}`);
    }

    if (patient.medical_history) {
      contextParts.push(`Medical History: ${patient.medical_history.slice(0, 500)}`);
    }

    const timeline = timelineResult.data ?? [];
    if (timeline.length > 0) {
      contextParts.push(
        `\nTimeline Events (most recent first):\n` +
        timeline.map((e: {event_type: string; event_date: string; title: string; summary: string | null}) =>
          `- [${e.event_type}] ${new Date(e.event_date).toLocaleDateString()}: ${e.title}${e.summary ? ` — ${e.summary}` : ""}`
        ).join("\n")
      );
    }

    const visits = visitsResult.data ?? [];
    if (visits.length > 0) {
      contextParts.push(
        `\nVisits with Vitals/Ratings:\n` +
        visits.map((v: {visit_date: string; chief_complaint: string | null; vitals_data: unknown; health_ratings: unknown; assessment: string | null}) => {
          const parts = [`${new Date(v.visit_date).toLocaleDateString()}`];
          if (v.chief_complaint) parts.push(`Complaint: ${v.chief_complaint}`);
          if (v.vitals_data) parts.push(`Vitals: ${JSON.stringify(v.vitals_data)}`);
          if (v.health_ratings) parts.push(`Pillars: ${JSON.stringify(v.health_ratings)}`);
          if (v.assessment) parts.push(`Assessment: ${(v.assessment as string).slice(0, 200)}`);
          return parts.join(" | ");
        }).join("\n")
      );
    }

    const biomarkers = biomarkersResult.data ?? [];
    if (biomarkers.length > 0) {
      contextParts.push(
        `\nFlagged Biomarkers (last 90 days):\n` +
        biomarkers.map((b: {biomarker_name: string | null; value: number | null; unit: string | null; functional_flag: string | null; conventional_flag: string | null; category: string | null; collection_date: string | null}) =>
          `- ${b.biomarker_name}: ${b.value} ${b.unit || ""} [${b.functional_flag || b.conventional_flag}] (${b.category || "general"}) — ${b.collection_date}`
        ).join("\n")
      );
    }

    const supplements = supplementsResult.data ?? [];
    if (supplements.length > 0) {
      contextParts.push(
        `\nActive Supplements:\n` +
        supplements.map((s: {name: string; dosage: string | null; form: string | null; timing: string | null}) =>
          `- ${s.name}${s.dosage ? ` ${s.dosage}` : ""}${s.form ? ` ${s.form}` : ""}${s.timing ? `, ${s.timing}` : ""}`
        ).join("\n")
      );
    }

    const clinicalContext = contextParts.join("\n\n");

    // ── 3. Call Claude ────────────────────────────────────────────────

    const systemPrompt = `You are a functional medicine clinical analyst. Review the patient's longitudinal data and provide a structured clinical synthesis.

Analyze trends across biomarkers, vitals, health pillar ratings, supplements, and timeline events.
Identify meaningful correlations between different dimensions of health.
Suggest evidence-based hypotheses for root causes.

Return ONLY valid JSON matching this exact schema:
{
  "summary": "2-3 sentence overview of the patient's current health trajectory",
  "key_trends": ["3-5 notable trends with direction and significance"],
  "correlations": ["3-5 connections across dimensions (e.g., poor sleep → elevated cortisol → weight gain)"],
  "potential_root_causes": ["2-4 root cause hypotheses with supporting evidence from the data"],
  "bright_spots": ["2-3 positive findings or improvements worth acknowledging"],
  "focus_areas": ["2-3 highest priority areas to address next"]
}

Be specific and data-driven. Reference actual values, dates, and measurements when available.`;

    const { text } = await createCompletion({
      model: MODELS.standard,
      maxTokens: 1200,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze this patient's clinical data and return the JSON synthesis:\n\n${clinicalContext}`,
        },
      ],
    });

    // Parse the JSON response
    let result: SynthesisResult;
    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      return jsonError("AI returned invalid JSON. Please try again.", 500);
    }

    // ── 4. Upsert ai_insight timeline event ───────────────────────────

    const eventDate = new Date().toISOString();

    const { data: existing } = await supabase
      .from("timeline_events")
      .select("id")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .eq("source_table", "patients")
      .eq("source_id", patientId)
      .eq("event_type", "ai_insight")
      .maybeSingle();

    let eventId: string;

    if (existing) {
      await supabase
        .from("timeline_events")
        .update({
          title: "AI Clinical Synthesis",
          summary: result.summary,
          detail: { ...result, generated_at: eventDate },
          event_date: eventDate,
        })
        .eq("id", existing.id);
      eventId = existing.id;
    } else {
      const { data: inserted } = await supabase
        .from("timeline_events")
        .insert({
          patient_id: patientId,
          practitioner_id: practitioner.id,
          event_type: "ai_insight",
          event_date: eventDate,
          source_table: "patients",
          source_id: patientId,
          title: "AI Clinical Synthesis",
          summary: result.summary,
          detail: { ...result, generated_at: eventDate },
          visible_to_patient: false,
          is_pinned: false,
        })
        .select("id")
        .single();
      eventId = inserted?.id ?? "";
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "generate",
      resourceType: "timeline_event",
      resourceId: patientId,
      detail: { type: "ai_insight", patient_id: patientId, updated: !!existing },
    });

    return NextResponse.json({ event_id: eventId, result });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

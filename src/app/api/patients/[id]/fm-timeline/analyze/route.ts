import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { createCompletion, MODELS } from "@/lib/ai/provider";
import type { FMTimelineEvent } from "@/types/database";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/patients/[id]/fm-timeline/analyze ───────────────────────────
// Analyzes the patient's FM timeline events (antecedents, triggers, mediators)
// along with chief complaints and medical history to identify root cause patterns.
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

    const body = await request.json();
    const events: FMTimelineEvent[] = body.events ?? [];

    if (events.length === 0) {
      return jsonError("No timeline events to analyze", 400);
    }

    // Fetch patient context
    const { data: patient } = await supabase
      .from("patients")
      .select("first_name, last_name, date_of_birth, sex, chief_complaints, medical_history")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!patient) return jsonError("Patient not found", 404);

    // Build context string
    const name = [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "Patient";
    const age = patient.date_of_birth
      ? `${Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))} years old`
      : "Age unknown";

    const antecedents = events.filter((e) => e.category === "antecedent");
    const triggers = events.filter((e) => e.category === "trigger");
    const mediators = events.filter((e) => e.category === "mediator");

    const formatEvents = (evts: FMTimelineEvent[]) =>
      evts.map((e) => `- [${e.life_stage}] ${e.title}${e.year ? ` (${e.year})` : ""}${e.notes ? `: ${e.notes}` : ""}`).join("\n");

    const context = [
      `Patient: ${name}, ${age}, ${patient.sex || "sex unspecified"}`,
      patient.chief_complaints?.length
        ? `Chief Complaints: ${patient.chief_complaints.join(", ")}`
        : "",
      patient.medical_history
        ? `Medical History: ${patient.medical_history.slice(0, 400)}`
        : "",
      antecedents.length > 0
        ? `\nAntecedents (predisposing factors):\n${formatEvents(antecedents)}`
        : "",
      triggers.length > 0
        ? `\nTriggers (inciting events):\n${formatEvents(triggers)}`
        : "",
      mediators.length > 0
        ? `\nMediators (perpetuating factors):\n${formatEvents(mediators)}`
        : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are a functional medicine clinical analyst specializing in root cause analysis using the ATM (Antecedents, Triggers, Mediators) framework.

Review the patient's health timeline and identify meaningful patterns and root cause hypotheses.

Return ONLY valid JSON matching this exact schema:
{
  "summary": "2-3 sentence overview connecting the patient's timeline to their current health picture",
  "antecedent_patterns": ["2-3 patterns or themes across predisposing factors"],
  "trigger_patterns": ["2-3 patterns across inciting events — timing, clustering, type"],
  "mediator_patterns": ["2-3 ongoing factors perpetuating dysfunction"],
  "root_cause_hypotheses": ["2-4 evidence-based root cause hypotheses with supporting ATM evidence"],
  "recommended_focus": ["2-3 highest-priority clinical areas to investigate based on this timeline"]
}

Be specific. Reference actual events, life stages, and temporal patterns from the data.`;

    const { text } = await createCompletion({
      model: MODELS.standard,
      maxTokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze this patient's FM health timeline and return JSON:\n\n${context}`,
        },
      ],
    });

    let result;
    try {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      return jsonError("AI returned invalid JSON. Please try again.", 500);
    }

    return NextResponse.json({ result });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

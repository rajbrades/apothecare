import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCompletion, MODELS } from "@/lib/ai/provider";
import { buildScribeSystemPrompt } from "@/lib/ai/scribe-prompts";
import { ENCOUNTER_TEMPLATES } from "@/lib/templates/definitions";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { scribeSchema } from "@/lib/validations/visit";
import { auditLog } from "@/lib/api/audit";
import { validateInputSafety, PromptInjectionError } from "@/lib/api/validate-input";

export const runtime = "nodejs";
export const maxDuration = 120;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/visits/[id]/scribe
 *
 * Takes a raw transcript and uses AI to assign content to the
 * encounter template sections for the visit's type.
 *
 * Input:  { transcript: string }
 * Output: { sections: Record<string, string> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: visitId } = await params;
    const supabase = await createClient();

    // Auth
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
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const rateLimitError = await checkRateLimit(
      supabase, practitioner.id, practitioner.subscription_tier, "visit_scribe"
    );
    if (rateLimitError) return rateLimitError;

    // Verify visit ownership
    const { data: visit } = await supabase
      .from("visits")
      .select("id, visit_type, status, patient_id, patients(first_name, last_name, date_of_birth, sex, chief_complaints)")
      .eq("id", visitId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!visit) return jsonError("Visit not found", 404);
    if (visit.status === "completed")
      return jsonError("Cannot modify a completed visit", 409);

    // Parse and validate input
    const body = await request.json();
    const parsed = scribeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const { transcript } = parsed.data;

    // Prompt injection detection
    validateInputSafety(transcript, {
      request,
      practitionerId: practitioner.id,
      resourceType: "visit",
      resourceId: visitId,
    });

    // Get template sections for this visit type
    const visitType = visit.visit_type || "soap";
    const template = ENCOUNTER_TEMPLATES[visitType] || ENCOUNTER_TEMPLATES.soap;

    // Build the scribe prompt with template section definitions
    const systemPrompt = buildScribeSystemPrompt(template.sections);

    // Build patient context hint if available
    const patient = visit.patients as {
      first_name?: string | null;
      last_name?: string | null;
      date_of_birth?: string | null;
      sex?: string | null;
      chief_complaints?: string[] | null;
    } | null;

    let patientHint = "";
    if (patient) {
      const parts: string[] = [];
      const name = [patient.first_name, patient.last_name]
        .filter(Boolean)
        .join(" ");
      if (name) parts.push(`Patient: ${name}`);
      if (patient.sex) parts.push(`Sex: ${patient.sex}`);
      if (patient.date_of_birth) {
        const age = Math.floor(
          (Date.now() - new Date(patient.date_of_birth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        );
        parts.push(`Age: ${age}`);
      }
      if (patient.chief_complaints?.length) {
        parts.push(
          `Known chief complaints: ${patient.chief_complaints.join(", ")}`
        );
      }
      if (parts.length) {
        patientHint = `\n\nPatient context: ${parts.join(" | ")}`;
      }
    }

    // Call AI to parse the transcript into sections
    const result = await createCompletion({
      model: MODELS.standard,
      maxTokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Parse the following clinical encounter transcript and assign the content to the appropriate documentation sections.\n\nTranscript:\n${transcript}${patientHint}`,
        },
      ],
    });

    // Parse JSON from response
    let sections: Record<string, string> = {};
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sections = JSON.parse(jsonMatch[0]);
      }
    } catch {
      return jsonError("Failed to parse AI response", 500);
    }

    // Filter out empty sections and validate keys
    const validKeys = new Set(template.sections.map((s) => s.key));
    const filteredSections: Record<string, string> = {};
    for (const [key, value] of Object.entries(sections)) {
      if (validKeys.has(key) && typeof value === "string" && value.trim()) {
        filteredSections[key] = value.trim();
      }
    }

    // Save the raw transcript to the visit
    await supabase
      .from("visits")
      .update({ raw_notes: transcript })
      .eq("id", visitId);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "generate",
      resourceType: "visit",
      resourceId: visitId,
      detail: {
        action: "scribe",
        visit_type: visitType,
        transcript_length: transcript.length,
        sections_populated: Object.keys(filteredSections).length,
      },
    });

    return NextResponse.json({ sections: filteredSections });
  } catch (error) {
    if (error instanceof PromptInjectionError) {
      return jsonError("Input blocked by safety filter. Please rephrase.", 400);
    }
    console.error("Scribe error:", error);
    return jsonError("Scribe processing failed", 500);
  }
}

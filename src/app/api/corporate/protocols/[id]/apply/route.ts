import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { z } from "zod";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const applySchema = z.object({
  patient_id: z.string().uuid(),
});

/**
 * POST /api/corporate/protocols/[id]/apply
 * Apply a corporate protocol to a patient's treatment plan.
 * Creates a treatment_protocol record linked to the corporate template.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: protocolId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();

    if (!practitioner) return jsonError("Practitioner not found", 404);

    const body = await request.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    // Verify patient ownership
    const { data: patient } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("id", parsed.data.patient_id)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!patient) return jsonError("Patient not found", 404);

    // Fetch the corporate protocol with steps
    const [{ data: corpProtocol }, { data: steps }] = await Promise.all([
      supabase
        .from("corporate_protocols")
        .select("id, title, category, version, corporate_id")
        .eq("id", protocolId)
        .single(),
      supabase
        .from("corporate_protocol_steps")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("step_order"),
    ]);

    if (!corpProtocol) return jsonError("Corporate protocol not found", 404);

    // Create treatment protocol from corporate template
    const { data: treatmentProtocol, error: createError } = await supabase
      .from("treatment_protocols")
      .insert({
        patient_id: parsed.data.patient_id,
        practitioner_id: practitioner.id,
        title: corpProtocol.title,
        status: "draft",
        focus_areas: [corpProtocol.category],
        generation_context: {
          source: "corporate_protocol",
          corporate_protocol_id: corpProtocol.id,
          corporate_protocol_version: corpProtocol.version,
          corporate_id: corpProtocol.corporate_id,
        },
      })
      .select("id")
      .single();

    if (createError || !treatmentProtocol) {
      return jsonError("Failed to create treatment protocol", 500);
    }

    // Create a single phase from the corporate protocol steps
    const supplements = (steps || [])
      .filter((s: { step_type: string }) => s.step_type === "supplement" || s.step_type === "medication")
      .map((s: { name: string; dosage: string | null; frequency: string | null; timing: string | null; clinical_justification: string; step_type: string; cycle_on_days: number | null; cycle_off_days: number | null }) => ({
        name: s.name,
        dosage: s.dosage,
        frequency: s.frequency,
        timing: s.timing,
        rationale: s.clinical_justification,
        action: "start",
        step_type: s.step_type,
        cycle_on_days: s.cycle_on_days,
        cycle_off_days: s.cycle_off_days,
      }));

    const lifestyle = (steps || [])
      .filter((s: { step_type: string }) => s.step_type === "lifestyle")
      .map((s: { name: string; clinical_justification: string }) => `${s.name}: ${s.clinical_justification}`);

    const diet = (steps || [])
      .filter((s: { step_type: string }) => s.step_type === "diet")
      .map((s: { name: string; clinical_justification: string }) => `${s.name}: ${s.clinical_justification}`);

    await supabase.from("protocol_phases").insert({
      protocol_id: treatmentProtocol.id,
      phase_number: 1,
      title: corpProtocol.title,
      goal: `Applied from corporate protocol: ${corpProtocol.title}`,
      duration_weeks: 12,
      status: "pending",
      supplements,
      lifestyle,
      diet,
    });

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "treatment_protocol",
      resourceId: treatmentProtocol.id,
      detail: {
        source: "corporate_protocol",
        corporate_protocol_id: corpProtocol.id,
        patient_id: parsed.data.patient_id,
      },
    });

    return NextResponse.json({
      treatment_protocol_id: treatmentProtocol.id,
      message: `Protocol "${corpProtocol.title}" applied to ${patient.first_name} ${patient.last_name}`,
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

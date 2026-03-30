import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { isFeatureAvailable, proGateResponse } from "@/lib/tier/gates";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const extendPhaseSchema = z.object({
  additional_weeks: z
    .number()
    .int()
    .min(1, "Must extend by at least 1 week")
    .max(12, "Cannot extend by more than 12 weeks"),
});

// ── POST /api/patients/[id]/protocols/[protocolId]/phases/[phaseId]/extend ──
// Extend the current phase duration.

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; protocolId: string; phaseId: string }>;
  }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, protocolId, phaseId } = await params;
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

    if (!isFeatureAvailable(practitioner.subscription_tier, "protocol_generation")) {
      return proGateResponse(NextResponse, "Protocol Generator");
    }

    // Validate body
    const body = await request.json();
    const parsed = extendPhaseSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const { additional_weeks } = parsed.data;

    // Verify protocol ownership
    const { data: protocol } = await supabase
      .from("treatment_protocols")
      .select("id, status")
      .eq("id", protocolId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!protocol) return jsonError("Protocol not found", 404);
    if (protocol.status !== "active") {
      return jsonError("Protocol must be active to extend phases", 409);
    }

    // Fetch current phase
    const { data: currentPhase } = await supabase
      .from("protocol_phases")
      .select("id, phase_number, duration_weeks, status")
      .eq("id", phaseId)
      .eq("protocol_id", protocolId)
      .single();
    if (!currentPhase) return jsonError("Phase not found", 404);
    if (currentPhase.status !== "active" && currentPhase.status !== "extended") {
      return jsonError("Only active or extended phases can be extended", 409);
    }

    const newDuration = currentPhase.duration_weeks + additional_weeks;
    const now = new Date().toISOString();

    // Update phase
    const { data: updated, error: updateError } = await supabase
      .from("protocol_phases")
      .update({
        duration_weeks: newDuration,
        status: "extended",
      })
      .eq("id", phaseId)
      .select()
      .single();

    if (updateError) {
      console.error("Phase extend error:", updateError);
      return jsonError("Failed to extend phase", 500);
    }

    // Insert progress event
    await supabase.from("protocol_progress").insert({
      protocol_id: protocolId,
      phase_id: phaseId,
      event_type: "phase_extended",
      event_date: now,
      detail: {
        phase_number: currentPhase.phase_number,
        additional_weeks,
        previous_duration: currentPhase.duration_weeks,
        new_duration: newDuration,
      },
    });

    // Update protocol total_duration_weeks
    const { data: allPhases } = await supabase
      .from("protocol_phases")
      .select("duration_weeks")
      .eq("protocol_id", protocolId);

    if (allPhases) {
      const totalWeeks = allPhases.reduce(
        (sum: number, p: { duration_weeks: number }) => sum + p.duration_weeks,
        0
      );
      await supabase
        .from("treatment_protocols")
        .update({ total_duration_weeks: totalWeeks })
        .eq("id", protocolId);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "protocol_phase",
      resourceId: phaseId,
      detail: {
        patient_id: patientId,
        protocol_id: protocolId,
        action: "extend",
        phase_number: currentPhase.phase_number,
        additional_weeks,
        new_duration: newDuration,
      },
    });

    return NextResponse.json({ phase: updated });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

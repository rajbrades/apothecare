import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { isFeatureAvailable, proGateResponse } from "@/lib/tier/gates";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/patients/[id]/protocols/[protocolId]/phases/[phaseId]/advance ──
// Complete the current phase and activate the next one.

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
      return jsonError("Protocol must be active to advance phases", 409);
    }

    // Fetch current phase
    const { data: currentPhase } = await supabase
      .from("protocol_phases")
      .select("id, phase_number, status")
      .eq("id", phaseId)
      .eq("protocol_id", protocolId)
      .single();
    if (!currentPhase) return jsonError("Phase not found", 404);
    if (currentPhase.status !== "active" && currentPhase.status !== "extended") {
      return jsonError("Only active or extended phases can be advanced", 409);
    }

    const now = new Date().toISOString();

    // Complete current phase
    await supabase
      .from("protocol_phases")
      .update({ status: "completed", completed_at: now })
      .eq("id", phaseId);

    // Insert progress event for phase completion
    await supabase.from("protocol_progress").insert({
      protocol_id: protocolId,
      phase_id: phaseId,
      event_type: "phase_completed",
      event_date: now,
      detail: { phase_number: currentPhase.phase_number },
    });

    // Find next phase
    const { data: nextPhase } = await supabase
      .from("protocol_phases")
      .select("id, phase_number")
      .eq("protocol_id", protocolId)
      .eq("status", "pending")
      .order("phase_number", { ascending: true })
      .limit(1)
      .single();

    let protocolCompleted = false;

    if (nextPhase) {
      // Activate next phase
      await supabase
        .from("protocol_phases")
        .update({ status: "active", started_at: now })
        .eq("id", nextPhase.id);

      // Insert progress event for phase started
      await supabase.from("protocol_progress").insert({
        protocol_id: protocolId,
        phase_id: nextPhase.id,
        event_type: "phase_started",
        event_date: now,
        detail: { phase_number: nextPhase.phase_number },
      });
    } else {
      // No more phases — complete the protocol
      protocolCompleted = true;
      await supabase
        .from("treatment_protocols")
        .update({ status: "completed", completed_at: now })
        .eq("id", protocolId);

      await supabase.from("protocol_progress").insert({
        protocol_id: protocolId,
        phase_id: phaseId,
        event_type: "protocol_completed",
        event_date: now,
        detail: {},
      });
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
        action: "advance",
        completed_phase: currentPhase.phase_number,
        next_phase: nextPhase?.phase_number ?? null,
        protocol_completed: protocolCompleted,
      },
    });

    // Re-fetch the full protocol state to return
    const { data: updatedProtocol } = await supabase
      .from("treatment_protocols")
      .select("*")
      .eq("id", protocolId)
      .single();

    const { data: updatedPhases } = await supabase
      .from("protocol_phases")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("phase_number", { ascending: true });

    return NextResponse.json({
      protocol: { ...updatedProtocol, phases: updatedPhases || [] },
      advanced: {
        completed_phase_id: phaseId,
        completed_phase_number: currentPhase.phase_number,
        next_phase_id: nextPhase?.id ?? null,
        next_phase_number: nextPhase?.phase_number ?? null,
        protocol_completed: protocolCompleted,
      },
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

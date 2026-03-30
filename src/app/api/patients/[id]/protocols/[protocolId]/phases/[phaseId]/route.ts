import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { updatePhaseSchema } from "@/lib/validations/protocol";
import { isFeatureAvailable, proGateResponse } from "@/lib/tier/gates";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── PATCH /api/patients/[id]/protocols/[protocolId]/phases/[phaseId] ────

export async function PATCH(
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
    const parsed = updatePhaseSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    // Verify protocol ownership
    const { data: protocol } = await supabase
      .from("treatment_protocols")
      .select("id")
      .eq("id", protocolId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!protocol) return jsonError("Protocol not found", 404);

    // Verify phase belongs to protocol
    const { data: existingPhase } = await supabase
      .from("protocol_phases")
      .select("id")
      .eq("id", phaseId)
      .eq("protocol_id", protocolId)
      .single();
    if (!existingPhase) return jsonError("Phase not found", 404);

    // Update phase
    const { data: updated, error: updateError } = await supabase
      .from("protocol_phases")
      .update(parsed.data)
      .eq("id", phaseId)
      .select()
      .single();

    if (updateError) {
      console.error("Phase update error:", updateError);
      return jsonError("Failed to update phase", 500);
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
        fields: Object.keys(parsed.data),
      },
    });

    return NextResponse.json({ phase: updated });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

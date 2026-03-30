import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { updateProtocolSchema } from "@/lib/validations/protocol";
import { isFeatureAvailable, proGateResponse } from "@/lib/tier/gates";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/patients/[id]/protocols/[protocolId] — Full protocol detail ──

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; protocolId: string }> }
) {
  try {
    const { id: patientId, protocolId } = await params;
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

    // Fetch protocol with phases
    const { data: protocol, error: fetchError } = await supabase
      .from("treatment_protocols")
      .select("*")
      .eq("id", protocolId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (fetchError || !protocol) return jsonError("Protocol not found", 404);

    const { data: phases } = await supabase
      .from("protocol_phases")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("phase_number", { ascending: true });

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "treatment_protocol",
      resourceId: protocolId,
      detail: { patient_id: patientId },
    });

    return NextResponse.json({
      protocol: { ...protocol, phases: phases || [] },
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── PATCH /api/patients/[id]/protocols/[protocolId] — Update protocol ────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; protocolId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, protocolId } = await params;
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
    const parsed = updateProtocolSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    // Verify protocol ownership
    const { data: existing } = await supabase
      .from("treatment_protocols")
      .select("id, status")
      .eq("id", protocolId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!existing) return jsonError("Protocol not found", 404);

    // Build update payload
    const update: Record<string, unknown> = { ...parsed.data };
    const now = new Date().toISOString();

    // Status transition logic
    if (parsed.data.status && parsed.data.status !== existing.status) {
      if (parsed.data.status === "active" && existing.status === "draft") {
        update.started_at = now;

        // Activate first phase
        const { data: firstPhase } = await supabase
          .from("protocol_phases")
          .select("id")
          .eq("protocol_id", protocolId)
          .order("phase_number", { ascending: true })
          .limit(1)
          .single();

        if (firstPhase) {
          await supabase
            .from("protocol_phases")
            .update({ status: "active", started_at: now })
            .eq("id", firstPhase.id);
        }
      } else if (parsed.data.status === "completed") {
        update.completed_at = now;
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("treatment_protocols")
      .update(update)
      .eq("id", protocolId)
      .select()
      .single();

    if (updateError) {
      console.error("Protocol update error:", updateError);
      return jsonError("Failed to update protocol", 500);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "treatment_protocol",
      resourceId: protocolId,
      detail: {
        patient_id: patientId,
        fields: Object.keys(parsed.data),
        status_change: parsed.data.status
          ? `${existing.status} -> ${parsed.data.status}`
          : undefined,
      },
    });

    return NextResponse.json({ protocol: updated });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

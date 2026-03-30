import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";
import { isFeatureAvailable, proGateResponse } from "@/lib/tier/gates";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/patients/[id]/protocols — List all protocols for a patient ──

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
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

    // Tier gate — protocol_generation is Pro+
    if (!isFeatureAvailable(practitioner.subscription_tier, "protocol_generation")) {
      return proGateResponse(NextResponse, "Protocol Generator");
    }

    // Verify patient belongs to practitioner
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!patient) return jsonError("Patient not found", 404);

    // Fetch protocols with phase counts
    const { data: protocols, error: fetchError } = await supabase
      .from("treatment_protocols")
      .select("*, protocol_phases(id, phase_number, status)")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Protocol list error:", fetchError);
      return jsonError("Failed to fetch protocols", 500);
    }

    // Transform to include phase_count and active_phase_number
    const protocolList = (protocols || []).map(
      (p: Record<string, unknown> & { protocol_phases?: { id: string; phase_number: number; status: string }[] }) => {
        const phases = p.protocol_phases || [];
        const activePhase = phases.find(
          (ph) => ph.status === "active"
        );
        return {
          ...p,
          protocol_phases: undefined,
          phase_count: phases.length,
          active_phase_number: activePhase?.phase_number ?? null,
        };
      }
    );

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "treatment_protocol",
      detail: { list: true, patient_id: patientId, count: protocolList.length },
    });

    return NextResponse.json({ protocols: protocolList });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

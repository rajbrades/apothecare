import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { rebuildPatientClinicalSummary } from "@/lib/ai/clinical-summary";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/patients/[id]/resynthesize
 * Re-synthesize pre-chart clinical summary from all extracted documents.
 */
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
    if (!practitioner) return jsonError("Unauthorized", 401);

    // Verify patient belongs to practitioner
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!patient) return jsonError("Patient not found", 404);

    // Rebuild clinical summary from all extracted documents + visits using AI
    await rebuildPatientClinicalSummary(patientId, practitioner.id, { useAI: true });

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "generate",
      resourceType: "clinical_summary",
      resourceId: patientId,
      detail: { action: "resynthesize" },
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { mergeIFMMatrix } from "@/lib/ifm/merge";
import { z } from "zod";

const mergeBodySchema = z.object({
  visit_id: z.string().uuid("Invalid visit ID"),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/patients/[id]/ifm-matrix/merge — Merge visit IFM Matrix into patient
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

    const body = await request.json();
    const parsed = mergeBodySchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { visit_id } = parsed.data;

    // Read visit (verify ownership + patient linkage)
    const { data: visit } = await supabase
      .from("visits")
      .select("id, patient_id, ifm_matrix")
      .eq("id", visit_id)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!visit) return jsonError("Visit not found", 404);
    if (visit.patient_id !== patientId) return jsonError("Visit is not linked to this patient", 400);

    // Read current patient matrix
    const { data: patient } = await supabase
      .from("patients")
      .select("id, ifm_matrix")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!patient) return jsonError("Patient not found", 404);

    // Merge
    const merged = mergeIFMMatrix(patient.ifm_matrix, visit.ifm_matrix);

    // Update patient
    const { error: updateErr } = await supabase
      .from("patients")
      .update({ ifm_matrix: merged })
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id);

    if (updateErr) return jsonError("Failed to update patient matrix", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "patient",
      resourceId: patientId,
      detail: {
        action: "ifm_matrix_merge",
        source_visit_id: visit_id,
      },
    });

    return NextResponse.json({ ifm_matrix: merged });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { updatePatientSupplementSchema } from "@/lib/validations/patient-supplement";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthPractitioner(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return practitioner;
}

// ── PATCH /api/patients/[id]/supplements/[supId] — Update supplement ──

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; supId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, supId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = updatePatientSupplementSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { data, error } = await supabase
      .from("patient_supplements")
      .update(parsed.data)
      .eq("id", supId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .select()
      .single();

    if (error) return jsonError("Internal server error", 500);
    if (!data) return jsonError("Supplement not found", 404);

    auditLog({
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "patient_supplement",
      resourceId: supId,
      detail: { patient_id: patientId, fields_updated: Object.keys(parsed.data) },
      request,
    });

    return NextResponse.json({ supplement: data });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── DELETE /api/patients/[id]/supplements/[supId] — Discontinue ───────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; supId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, supId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    // Soft delete: mark as discontinued
    const { data, error } = await supabase
      .from("patient_supplements")
      .update({
        status: "discontinued",
        discontinued_at: new Date().toISOString(),
      })
      .eq("id", supId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .select("id, name")
      .single();

    if (error) return jsonError("Internal server error", 500);
    if (!data) return jsonError("Supplement not found", 404);

    auditLog({
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "patient_supplement",
      resourceId: supId,
      detail: { patient_id: patientId, action: "discontinued", supplement_name: data.name },
      request,
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

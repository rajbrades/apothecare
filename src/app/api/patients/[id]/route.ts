import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updatePatientSchema } from "@/lib/validations/patient";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

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

// ── GET /api/patients/[id] — Fetch single patient with document count ───
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const { data: patient, error } = await supabase
      .from("patients")
      .select("id, practitioner_id, first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies, notes, clinical_summary, ifm_matrix, is_archived, created_at, updated_at")
      .eq("id", id)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (error || !patient) return jsonError("Patient not found", 404);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "patient",
      resourceId: id,
    });

    // Fetch document count
    const { count } = await supabase
      .from("patient_documents")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", id);

    return NextResponse.json({ patient, documentCount: count || 0 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── PATCH /api/patients/[id] — Update patient fields ────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = updatePatientSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { data: patient, error } = await supabase
      .from("patients")
      .update(parsed.data)
      .eq("id", id)
      .eq("practitioner_id", practitioner.id)
      .select()
      .single();

    if (error) return jsonError("Failed to update patient", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "patient",
      resourceId: id,
      detail: { fields_updated: Object.keys(parsed.data) },
    });

    return NextResponse.json({ patient });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── DELETE /api/patients/[id] — Soft delete (archive) ───────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const { error } = await supabase
      .from("patients")
      .update({ is_archived: true })
      .eq("id", id)
      .eq("practitioner_id", practitioner.id);

    if (error) return jsonError("Failed to archive patient", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "archive",
      resourceType: "patient",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

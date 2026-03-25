import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { updateSymptomLogSchema } from "@/lib/validations/symptom-log";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthPractitioner(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return practitioner;
}

// ── PATCH /api/patients/[id]/symptom-logs/[logId] ───────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, logId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = updateSymptomLogSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { data, error } = await supabase
      .from("symptom_logs")
      .update(parsed.data)
      .eq("id", logId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .select()
      .single();

    if (error) return jsonError("Internal server error", 500);
    if (!data) return jsonError("Symptom log not found", 404);

    auditLog({
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "symptom_log",
      resourceId: logId,
      detail: { patient_id: patientId, fields_updated: Object.keys(parsed.data) },
      request,
    });

    return NextResponse.json({ symptomLog: data });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── DELETE /api/patients/[id]/symptom-logs/[logId] ──────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, logId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const { data, error } = await supabase
      .from("symptom_logs")
      .delete()
      .eq("id", logId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .select("id, symptom_name")
      .single();

    if (error) return jsonError("Internal server error", 500);
    if (!data) return jsonError("Symptom log not found", 404);

    auditLog({
      practitionerId: practitioner.id,
      action: "delete",
      resourceType: "symptom_log",
      resourceId: logId,
      detail: { patient_id: patientId, symptom_name: data.symptom_name },
      request,
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

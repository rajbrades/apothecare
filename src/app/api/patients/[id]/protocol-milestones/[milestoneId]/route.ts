import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { updateProtocolMilestoneSchema } from "@/lib/validations/protocol-milestone";

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

// ── PATCH /api/patients/[id]/protocol-milestones/[milestoneId] ──────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, milestoneId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = updateProtocolMilestoneSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { data, error } = await supabase
      .from("protocol_milestones")
      .update(parsed.data)
      .eq("id", milestoneId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Milestone not found", 404);

    auditLog({
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "protocol_milestone",
      resourceId: milestoneId,
      detail: { patient_id: patientId, fields_updated: Object.keys(parsed.data) },
      request,
    });

    return NextResponse.json({ milestone: data });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── DELETE /api/patients/[id]/protocol-milestones/[milestoneId] ─────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, milestoneId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const { data, error } = await supabase
      .from("protocol_milestones")
      .delete()
      .eq("id", milestoneId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .select("id, title")
      .single();

    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Milestone not found", 404);

    auditLog({
      practitionerId: practitioner.id,
      action: "delete",
      resourceType: "protocol_milestone",
      resourceId: milestoneId,
      detail: { patient_id: patientId, title: data.title },
      request,
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

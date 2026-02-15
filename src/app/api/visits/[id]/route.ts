import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateVisitSchema } from "@/lib/validations/visit";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthPractitioner(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return practitioner;
}

// ── GET /api/visits/[id] — Fetch single visit with patient data ─────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const { data: visit, error } = await supabase
      .from("visits")
      .select("*, patients(id, first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies)")
      .eq("id", id)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (error || !visit) return jsonError("Visit not found", 404);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "visit",
      resourceId: id,
    });

    return NextResponse.json({ visit });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── PATCH /api/visits/[id] — Update visit fields ────────────────────────
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

    // Verify ownership and current status
    const { data: existing } = await supabase
      .from("visits")
      .select("id, status")
      .eq("id", id)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!existing) return jsonError("Visit not found", 404);

    const body = await request.json();
    const parsed = updateVisitSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    // Only allow edits on draft visits (unless reopening)
    if (existing.status === "completed" && parsed.data.status !== "draft") {
      return jsonError("Cannot edit a completed visit. Reopen it first.", 409);
    }

    const { data: visit, error } = await supabase
      .from("visits")
      .update(parsed.data)
      .eq("id", id)
      .eq("practitioner_id", practitioner.id)
      .select()
      .single();

    if (error) return jsonError("Failed to update visit", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "visit",
      resourceId: id,
      detail: { fields_updated: Object.keys(parsed.data) },
    });

    return NextResponse.json({ visit });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── DELETE /api/visits/[id] — Soft delete (archive) ─────────────────────
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
      .from("visits")
      .update({ is_archived: true })
      .eq("id", id)
      .eq("practitioner_id", practitioner.id);

    if (error) return jsonError("Failed to archive visit", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "delete",
      resourceType: "visit",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

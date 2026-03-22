import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/patient-portal/invites/[id]/revoke
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!practitioner) return jsonError("Unauthorized", 401);

  const { data: invite } = await supabase
    .from("patient_invites")
    .select("id, status, patient_id")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (!invite) return jsonError("Invite not found", 404);
  if (invite.status !== "pending") return jsonError("Only pending invites can be revoked", 400);

  const service = createServiceClient();
  await service
    .from("patient_invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", id);

  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "invite_revoked",
    resourceType: "patient_invite",
    resourceId: id,
    detail: { patient_id: invite.patient_id },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { sendPatientInviteEmail } from "@/lib/email/invite";

const INVITE_TTL_HOURS = 72;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/patient-portal/invites/[id]/resend
 * Revoke the existing invite and issue a fresh token.
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
    .select("id, full_name, practice_name, portal_slug")
    .eq("auth_user_id", user.id)
    .single();

  if (!practitioner) return jsonError("Unauthorized", 401);

  // Fetch existing invite
  const { data: existing } = await supabase
    .from("patient_invites")
    .select("id, patient_id, email, status")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (!existing) return jsonError("Invite not found", 404);
  if (existing.status === "accepted") return jsonError("Invite already accepted", 400);

  const service = createServiceClient();

  // Revoke old invite
  await service
    .from("patient_invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", id);

  // Create new invite
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data: newInvite, error } = await service
    .from("patient_invites")
    .insert({
      practitioner_id: practitioner.id,
      patient_id: existing.patient_id,
      email: existing.email,
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !newInvite) return jsonError("Failed to create invite", 500);

  // Get patient name for email
  const { data: patient } = await supabase
    .from("patients")
    .select("first_name")
    .eq("id", existing.patient_id)
    .single();

  const portalSlug = practitioner.portal_slug || practitioner.id;
  try {
    await sendPatientInviteEmail({
      to: existing.email,
      patientFirstName: patient?.first_name ?? null,
      practitionerName: practitioner.full_name,
      practiceName: practitioner.practice_name,
      portalSlug,
      rawToken,
      expiresInHours: INVITE_TTL_HOURS,
    });
  } catch (err) {
    console.error("[Invite Resend] Email send failed:", err);
  }

  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "invite_resent",
    resourceType: "patient_invite",
    resourceId: newInvite.id,
    detail: { patient_id: existing.patient_id, email: existing.email },
  });

  return NextResponse.json({ invite_id: newInvite.id, expires_at: expiresAt });
}

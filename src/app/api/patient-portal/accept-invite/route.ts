import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const schema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/patient-portal/accept-invite
 * Validates the invite token, links the current auth session to the patient record,
 * and marks the invite accepted.
 *
 * The patient must already be authenticated (magic link OTP) before calling this.
 * Flow: /portal/accept page → Supabase OTP email → callback → this endpoint.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("token is required", 400);

  const { token } = parsed.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized — please sign in first", 401);

  const service = createServiceClient();

  // Look up invite by token hash
  const { data: invite } = await service
    .from("patient_invites")
    .select("id, patient_id, practitioner_id, status, expires_at, email")
    .eq("token_hash", tokenHash)
    .single();

  if (!invite) return jsonError("Invalid or expired invitation link", 404);

  if (invite.status === "accepted") {
    return jsonError("This invitation has already been used", 400);
  }
  if (invite.status === "revoked") {
    return jsonError("This invitation has been revoked by your provider", 400);
  }
  if (invite.status === "expired" || new Date(invite.expires_at) < new Date()) {
    // Mark expired if not already
    if (invite.status !== "expired") {
      await service.from("patient_invites").update({ status: "expired" }).eq("id", invite.id);
    }
    return jsonError("This invitation link has expired. Please ask your provider to resend.", 400);
  }

  // Link auth user to patient record (idempotent)
  const { error: linkError } = await service
    .from("patients")
    .update({
      auth_user_id: user.id,
      portal_status: "active",
    })
    .eq("id", invite.patient_id)
    .is("auth_user_id", null); // Only set if not already linked

  // If the patient already has a different auth_user_id, reject
  const { data: patient } = await service
    .from("patients")
    .select("auth_user_id, portal_status")
    .eq("id", invite.patient_id)
    .single();

  if (!patient) return jsonError("Patient record not found", 500);
  if (patient.auth_user_id && patient.auth_user_id !== user.id) {
    return jsonError("This patient record is already linked to another account", 400);
  }

  // If linkError and patient already has this user's id, that's fine (re-accept)
  if (linkError && patient.auth_user_id !== user.id) {
    return jsonError("Failed to link account", 500);
  }

  // Mark invite accepted
  await service
    .from("patient_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  auditLog({
    request,
    practitionerId: invite.practitioner_id,
    action: "invite_accepted",
    resourceType: "patient_invite",
    resourceId: invite.id,
    detail: { patient_id: invite.patient_id, auth_user_id: user.id },
  });

  return NextResponse.json({ patient_id: invite.patient_id });
}

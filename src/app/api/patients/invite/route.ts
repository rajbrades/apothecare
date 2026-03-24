import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { createPatientWithInviteSchema } from "@/lib/validations/patient";
import { checkPatientLimit } from "@/lib/tier/gates";
import { sendPatientInviteEmail } from "@/lib/email/invite";

const INVITE_TTL_HOURS = 72;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/patients/invite
 * Create a patient AND send a portal invite in one atomic operation.
 * Required: first_name, last_name, email.
 */
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id, full_name, practice_name, portal_slug, subscription_tier")
    .eq("auth_user_id", user.id)
    .single();

  if (!practitioner) return jsonError("Unauthorized", 401);

  // Validate input
  const body = await request.json().catch(() => null);
  const parsed = createPatientWithInviteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0].message, 400);
  }
  const { first_name, last_name, email } = parsed.data;

  // Check patient limit (free tier)
  const limitError = await checkPatientLimit(supabase, practitioner.id, practitioner.subscription_tier, NextResponse);
  if (limitError) return limitError;

  const service = createServiceClient();

  // Create patient
  const { data: patient, error: patientError } = await service
    .from("patients")
    .insert({
      practitioner_id: practitioner.id,
      first_name,
      last_name,
      email,
      portal_status: "invited",
    })
    .select("id, first_name, last_name, email, portal_status, created_at")
    .single();

  if (patientError || !patient) {
    return jsonError(patientError?.message || "Failed to create patient", 500);
  }

  // Generate invite token
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data: invite, error: inviteError } = await service
    .from("patient_invites")
    .insert({
      practitioner_id: practitioner.id,
      patient_id: patient.id,
      email,
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (inviteError || !invite) {
    // Rollback: delete the patient we just created
    await service.from("patients").delete().eq("id", patient.id);
    return jsonError("Failed to create invite", 500);
  }

  // Send invite email (best-effort, non-blocking)
  const portalSlug = practitioner.portal_slug || practitioner.id;
  try {
    await sendPatientInviteEmail({
      to: email,
      patientFirstName: first_name,
      practitionerName: practitioner.full_name,
      practiceName: practitioner.practice_name,
      portalSlug,
      rawToken,
      expiresInHours: INVITE_TTL_HOURS,
    });
  } catch (err) {
    console.error("[Invite] Email send failed:", err);
  }

  // Audit log both actions
  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "create",
    resourceType: "patient",
    resourceId: patient.id,
    detail: { first_name, last_name, email, via: "quick_invite" },
  });

  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "invite_created",
    resourceType: "patient_invite",
    resourceId: invite.id,
    detail: { patient_id: patient.id, email },
  });

  return NextResponse.json(
    {
      patient,
      invite_id: invite.id,
      expires_at: expiresAt,
    },
    { status: 201 }
  );
}

import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { sendPatientInviteEmail } from "@/lib/email/invite";

const INVITE_TTL_HOURS = 72;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const createInviteSchema = z.object({
  patient_id: z.string().uuid(),
  email: z.string().email(),
});

/**
 * POST /api/patient-portal/invites
 * Create a patient portal invite. Invalidates any prior pending invite.
 */
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id, full_name, practice_name, portal_slug")
    .eq("auth_user_id", user.id)
    .single();

  if (!practitioner) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0].message, 400);
  }
  const { patient_id, email } = parsed.data;

  // Verify patient belongs to this practitioner
  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name")
    .eq("id", patient_id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (!patient) return jsonError("Patient not found", 404);

  const service = createServiceClient();

  // Revoke any existing pending invites for this patient
  await service
    .from("patient_invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("patient_id", patient_id)
    .eq("status", "pending");

  // Generate token
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await service
    .from("patient_invites")
    .insert({
      practitioner_id: practitioner.id,
      patient_id,
      email,
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !invite) {
    return jsonError("Failed to create invite", 500);
  }

  // Update patient portal_status
  await service
    .from("patients")
    .update({ portal_status: "invited" })
    .eq("id", patient_id);

  // Send invite email (best-effort)
  const portalSlug = practitioner.portal_slug || practitioner.id;
  try {
    await sendPatientInviteEmail({
      to: email,
      patientFirstName: patient.first_name,
      practitionerName: practitioner.full_name,
      practiceName: practitioner.practice_name,
      portalSlug,
      rawToken,
      expiresInHours: INVITE_TTL_HOURS,
    });
  } catch (err) {
    console.error("[Invite] Email send failed:", err);
    // Don't fail the request — invite is created, email failure is non-blocking
  }

  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "invite_created",
    resourceType: "patient_invite",
    resourceId: invite.id,
    detail: { patient_id, email },
  });

  return NextResponse.json({ invite_id: invite.id, expires_at: expiresAt });
}

/**
 * GET /api/patient-portal/invites?patient_id=...
 * List invites for a patient.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!practitioner) return jsonError("Unauthorized", 401);

  const patientId = request.nextUrl.searchParams.get("patient_id");
  if (!patientId) return jsonError("patient_id is required", 400);

  const { data: invites, error } = await supabase
    .from("patient_invites")
    .select("id, email, status, expires_at, accepted_at, revoked_at, created_at")
    .eq("patient_id", patientId)
    .eq("practitioner_id", practitioner.id)
    .order("created_at", { ascending: false });

  if (error) return jsonError("Internal server error", 500);

  return NextResponse.json({ invites: invites || [] });
}

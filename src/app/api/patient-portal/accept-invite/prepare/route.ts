import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/accept-invite/prepare?token=RAW_TOKEN
 *
 * Validates the invite token and generates a Supabase admin magic link
 * for the invite email. The client then redirects to that link, signing
 * the patient in without a separate email confirmation step.
 */
export async function GET(request: NextRequest) {
  const rawToken = request.nextUrl.searchParams.get("token");
  if (!rawToken) return jsonError("token is required", 400);

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const service = createServiceClient();

  const { data: invite } = await service
    .from("patient_invites")
    .select("id, email, status, expires_at, practitioner_id, practitioners(portal_slug)")
    .eq("token_hash", tokenHash)
    .single();

  if (!invite) return jsonError("Invalid or expired invitation link", 404);

  if (invite.status === "accepted") {
    return jsonError("This invitation has already been used", 400);
  }
  if (invite.status === "revoked") {
    return jsonError("This invitation has been revoked", 400);
  }
  if (new Date(invite.expires_at) < new Date()) {
    await service.from("patient_invites").update({ status: "expired" }).eq("id", invite.id);
    return jsonError("This invitation has expired. Please ask your provider to resend.", 400);
  }

  // Build the redirect URL — back to the accept page after signing in
  const practitioner = invite.practitioners as { portal_slug: string | null } | null;
  const slug = practitioner?.portal_slug ?? invite.practitioner_id;
  const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/portal/accept?token=${rawToken}&slug=${slug}`;

  // Ensure an auth user exists for this email (Quick Invite only creates
  // a patient record, not a Supabase Auth user). Try magiclink first — if
  // the user doesn't exist yet, fall back to a signup link which auto-creates.
  let actionLink: string | undefined;

  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: invite.email,
    options: { redirectTo },
  });

  if (error || !data?.properties?.action_link) {
    // User likely doesn't exist in Auth yet — create via signup link
    const { data: signupData, error: signupError } = await service.auth.admin.generateLink({
      type: "signup",
      email: invite.email,
      options: { redirectTo },
    });

    if (signupError || !signupData?.properties?.action_link) {
      console.error("[accept-invite/prepare] generateLink error:", error, signupError);
      return jsonError("Failed to generate sign-in link", 500);
    }
    actionLink = signupData.properties.action_link;
  } else {
    actionLink = data.properties.action_link;
  }

  // Extract token_hash and type from the action_link so the client can use
  // verifyOtp() directly instead of redirecting to Supabase's /auth/v1/verify
  // GET endpoint (which has stricter rate limits).
  const linkUrl = new URL(actionLink!);
  const otpTokenHash = linkUrl.searchParams.get("token");
  const otpType = linkUrl.searchParams.get("type") || "magiclink";

  return NextResponse.json({
    action_link: actionLink,
    token_hash: otpTokenHash,
    type: otpType,
  });
}

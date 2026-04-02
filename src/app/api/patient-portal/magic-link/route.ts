import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendMagicLinkEmail } from "@/lib/email/magic-link";
import { env } from "@/lib/env";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/patient-portal/magic-link
 * Generates a Supabase magic link for a patient and sends it via Resend
 * with Apothecare branding (bypasses Supabase's default email template).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email?.trim()?.toLowerCase();
    const slug = body?.slug || "";

    if (!email) return jsonError("Email is required", 400);

    const service = createServiceClient();

    // Verify this email belongs to an active patient
    const { data: patient } = await service
      .from("patients")
      .select("id, auth_user_id")
      .eq("portal_status", "active")
      .not("auth_user_id", "is", null)
      .limit(1);

    // Look up the auth user by email
    const { data: users } = await service.auth.admin.listUsers();
    const authUser = users?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === email
    );

    if (!authUser) {
      return jsonError(
        "No account found with that email address. If you haven't activated your invitation yet, check your email for an invitation link.",
        404
      );
    }

    // Verify this auth user is linked to a patient
    const { data: linkedPatient } = await service
      .from("patients")
      .select("id")
      .eq("auth_user_id", authUser.id)
      .eq("portal_status", "active")
      .maybeSingle();

    if (!linkedPatient) {
      return jsonError(
        "No active patient portal found for this email. Contact your provider for an invitation.",
        404
      );
    }

    // Generate magic link via Supabase admin (doesn't send email)
    const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/portal/callback`;

    const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.email!,
      options: { redirectTo },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("[Magic Link] Generate failed:", linkError?.message);
      return jsonError("Failed to generate sign-in link. Please try again.", 500);
    }

    // Build a portal callback URL with token_hash for client-side verification.
    // The action_link goes through Supabase's /auth/v1/verify which uses implicit
    // flow (hash fragments) — incompatible with @supabase/ssr PKCE. Instead, we
    // extract token_hash and verify client-side with verifyOtp().
    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = actionUrl.searchParams.get("token") || actionUrl.searchParams.get("token_hash") || "";
    const verifyType = actionUrl.searchParams.get("type") || "magiclink";
    const portalCallbackUrl = `${env.NEXT_PUBLIC_APP_URL}/portal/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(verifyType)}`;

    // Send branded email via Resend
    try {
      await sendMagicLinkEmail({
        to: email,
        magicLinkUrl: portalCallbackUrl,
      });
    } catch (emailErr) {
      console.error("[Magic Link] Email send failed:", emailErr);
      return jsonError("Failed to send sign-in email. Please try again.", 500);
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[Magic Link] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

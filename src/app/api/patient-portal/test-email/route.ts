import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPatientInviteEmail } from "@/lib/email/invite";
import { env } from "@/lib/env";

/**
 * POST /api/patient-portal/test-email
 * Dev/debug endpoint: sends a test invite email to the authenticated user.
 * Returns the Resend response or the full error so you can see exactly what's failing.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const to: string = body.to ?? user.email ?? "";

  if (!to) {
    return NextResponse.json({ error: "No recipient email" }, { status: 400 });
  }

  // Show current config (no secrets)
  const config = {
    RESEND_API_KEY: env.RESEND_API_KEY ? `set (${env.RESEND_API_KEY.slice(0, 6)}...)` : "NOT SET",
    RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: env.RESEND_FROM_NAME,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    to,
  };

  try {
    const result = await sendPatientInviteEmail({
      to,
      patientFirstName: "Test",
      practitionerName: "Dr. Test",
      practiceName: "Test Practice",
      portalSlug: "test",
      rawToken: "test-token-not-valid",
      expiresInHours: 72,
    });
    return NextResponse.json({ ok: true, config, resend_id: result.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, config, error: message }, { status: 500 });
  }
}

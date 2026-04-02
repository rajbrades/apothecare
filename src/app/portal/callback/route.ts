import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /portal/callback — Auth callback for patient portal magic links.
 *
 * Supabase redirects here with a `code` query param after magic link
 * verification. We exchange the code for a session, then redirect
 * to the portal dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/portal/dashboard`);
    }

    console.error("[Portal Callback] Code exchange failed:", error.message);
  }

  // Auth error — redirect to portal login
  return NextResponse.redirect(`${origin}/portal/login?error=auth_failed`);
}

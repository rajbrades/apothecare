import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Sanitize a redirect path to prevent open-redirect attacks.
 * Only allows relative paths that start with "/" and do not contain
 * protocol-relative prefixes ("//") or scheme indicators.
 */
function sanitizeRedirectPath(path: string | null): string {
  const fallback = "/dashboard";
  if (!path) return fallback;

  // Must start with exactly one "/" and not be protocol-relative ("//")
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;

  // Block any attempt to embed a scheme (e.g. "/\evil.com", data:, javascript:)
  if (/[\\:]/.test(path)) return fallback;

  return path;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if practitioner profile exists
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: practitioner } = await supabase
          .from("practitioners")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        // If no profile, redirect to onboarding
        if (!practitioner) {
          return NextResponse.redirect(`${origin}/auth/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}

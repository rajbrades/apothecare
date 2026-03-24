import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setTierCookie } from "@/lib/tier/tier-cookie";

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

  // Only check the pathname portion (before query string) for scheme injection
  // This allows colons in query values (e.g. /chat?q=DUTCH+test:+protocol)
  const pathname = path.split("?")[0];
  if (/[\\:]/.test(pathname)) return fallback;

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
          .select("id, subscription_tier")
          .eq("auth_user_id", user.id)
          .single();

        // If no profile, redirect to onboarding (threading next param)
        if (!practitioner) {
          const onboardingUrl = next !== "/dashboard"
            ? `${origin}/auth/onboarding?next=${encodeURIComponent(next)}`
            : `${origin}/auth/onboarding`;
          return NextResponse.redirect(onboardingUrl);
        }

        // Set tier cookie for middleware route gating
        const response = NextResponse.redirect(`${origin}${next}`);
        setTierCookie(response, practitioner.subscription_tier ?? "free");
        return response;
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}

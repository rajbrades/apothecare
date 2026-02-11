import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

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

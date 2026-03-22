import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }: any) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: any) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Patient portal routes — separate auth flow from provider routes
  const isPortalPath = pathname.startsWith("/portal/") || pathname.startsWith("/p/");
  const isPortalPublicPath =
    pathname.startsWith("/p/") ||         // branded entry pages
    pathname === "/portal/login" ||
    pathname === "/portal/accept";

  if (isPortalPath) {
    // Unauthenticated access to protected portal routes → portal login
    if (!user && !isPortalPublicPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login (except public routes)
  const publicPaths = [
    "/", "/auth/login", "/auth/register", "/auth/callback",
    "/terms", "/security", "/telehealth", "/advertising",
    "/gate", "/api/gate",
  ];
  const isPublicPath = publicPaths.some(
    (path) => pathname === path
  ) || pathname.startsWith("/prototype");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Allow authenticated users to access onboarding
  if (user && pathname === "/auth/onboarding") {
    return supabaseResponse;
  }

  // Redirect authenticated users away from login/register pages
  // Honor ?next param to preserve the user's intended destination
  if (
    user &&
    (pathname === "/auth/login" ||
      pathname === "/auth/register")
  ) {
    const nextParam = request.nextUrl.searchParams.get("next");
    if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
      return NextResponse.redirect(new URL(nextParam, request.nextUrl.origin));
    }
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

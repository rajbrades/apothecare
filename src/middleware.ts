import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const SITE_PASSWORD = process.env.SITE_PASSWORD;
const COOKIE_NAME = "site-auth";

export async function middleware(request: NextRequest) {
  // Site-wide password gate (skip if no SITE_PASSWORD env var is set)
  if (SITE_PASSWORD) {
    const { pathname } = request.nextUrl;

    // Allow the password page itself and static assets through
    if (pathname !== "/password" && !pathname.startsWith("/api/site-auth")) {
      const authed = request.cookies.get(COOKIE_NAME)?.value;
      if (authed !== "true") {
        const url = request.nextUrl.clone();
        url.pathname = "/password";
        return NextResponse.redirect(url);
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - API routes that don't need auth
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

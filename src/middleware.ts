import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Site-wide password gate (set SITE_PASSWORD env var to enable)
  const sitePassword = process.env.SITE_PASSWORD;
  if (sitePassword) {
    const pathname = request.nextUrl.pathname;
    const isGatePath = pathname === "/gate" || pathname === "/api/gate";
    // Patient portal has its own auth — never block it with the site gate
    const isPortalPath = pathname.startsWith("/portal/") || pathname.startsWith("/p/") || pathname.startsWith("/api/patient-portal/");

    if (!isGatePath && !isPortalPath) {
      const hasAccess = request.cookies.get("site_access")?.value === "granted";
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/gate", request.url));
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

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Site-wide password gate (set SITE_PASSWORD env var to enable)
  const sitePassword = process.env.SITE_PASSWORD;
  if (sitePassword) {
    const isGatePath =
      request.nextUrl.pathname === "/gate" ||
      request.nextUrl.pathname === "/api/gate";

    if (!isGatePath) {
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

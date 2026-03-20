import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/gate — Validate site password and set access cookie.
 */
export async function POST(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    // No password configured — allow access
    return NextResponse.json({ error: "No password required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { password } = body;

  if (!password || password !== sitePassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("site_access", "granted", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

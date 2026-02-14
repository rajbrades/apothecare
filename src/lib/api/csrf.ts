import { NextRequest } from "next/server";

/**
 * Validate that the request origin matches our app's origin.
 * Returns a 403 Response if the origin doesn't match, or null if valid.
 *
 * Browsers always send the Origin header on cross-origin requests and
 * on same-origin POST/PATCH/DELETE/PUT. If the header is absent
 * (e.g. server-to-server calls), the request is allowed through.
 */
export function validateCsrf(request: NextRequest): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null; // no origin header = not a browser cross-origin request

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const appOrigin = new URL(appUrl).origin;

  if (origin !== appOrigin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}

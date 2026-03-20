import { NextResponse } from "next/server";

/**
 * @deprecated Use POST /api/citations/verify instead.
 * This endpoint has been superseded by the universal citation verification API.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Use POST /api/citations/verify instead.",
      upgrade_url: "/api/citations/verify",
    },
    { status: 410 }
  );
}

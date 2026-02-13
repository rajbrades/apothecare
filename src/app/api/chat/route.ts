import { NextRequest, NextResponse } from "next/server";

// Deprecated: Use /api/chat/stream instead.
// This route exists only as a redirect for any legacy callers.
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/chat/stream instead." },
    { status: 410 }
  );
}

import { NextResponse } from "next/server";

// ── POST /api/labs/[id]/review — AI clinical review (stub) ────────────
export async function POST() {
  return NextResponse.json(
    { error: "AI clinical review is not yet available. This feature is coming soon." },
    { status: 501 }
  );
}

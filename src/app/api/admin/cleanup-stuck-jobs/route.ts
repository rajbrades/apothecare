import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const STUCK_THRESHOLD_MINUTES = 15;

// ── GET /api/admin/cleanup-stuck-jobs — Mark stuck processing jobs as error
// Protected by CRON_SECRET env var. Can be called via Vercel Cron or manually.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized", 401);
    }

    const serviceClient = createServiceClient();
    const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString();
    const errorMessage = "Processing timed out. Please retry.";

    // Fix stuck lab reports
    const { data: stuckLabs, error: labError } = await serviceClient
      .from("lab_reports")
      .update({ status: "error", error_message: errorMessage })
      .in("status", ["uploading", "parsing"])
      .lt("updated_at", cutoff)
      .select("id");

    // Fix stuck documents
    const { data: stuckDocs, error: docError } = await serviceClient
      .from("patient_documents")
      .update({ status: "error", error_message: errorMessage })
      .in("status", ["uploading", "extracting"])
      .lt("updated_at", cutoff)
      .select("id");

    return NextResponse.json({
      stuckLabs: stuckLabs?.length ?? 0,
      stuckDocs: stuckDocs?.length ?? 0,
      labError: labError?.message ?? null,
      docError: docError?.message ?? null,
      cutoff,
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

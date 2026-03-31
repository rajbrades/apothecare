import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { normalizeBiomarkers } from "@/lib/labs/normalize-biomarkers";
import type { ExtractedBiomarker } from "@/lib/ai/lab-parsing-prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/labs/[id]/recalculate
 * Re-runs biomarker normalization with current practitioner custom ranges.
 * Does NOT re-parse the PDF — only recalculates flags and functional ranges
 * from the already-extracted biomarker data.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: reportId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const { data: report } = await supabase
      .from("lab_reports")
      .select("id, patient_id, status, parsed_data, collection_date")
      .eq("id", reportId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!report) return jsonError("Lab report not found", 404);
    if (report.status !== "complete") return jsonError("Lab report is not yet parsed", 409);

    // Extract biomarkers from stored parsed_data
    const parsedData = report.parsed_data as { biomarkers?: ExtractedBiomarker[] } | null;
    const biomarkers = parsedData?.biomarkers;
    if (!biomarkers || biomarkers.length === 0) {
      return jsonError("No biomarker data found in parsed results", 404);
    }

    const serviceClient = createServiceClient();

    // Delete existing biomarker results
    await serviceClient
      .from("biomarker_results")
      .delete()
      .eq("lab_report_id", reportId);

    // Re-normalize with current practitioner overrides
    const result = await normalizeBiomarkers(
      biomarkers,
      reportId,
      report.patient_id,
      report.collection_date,
      serviceClient,
      practitioner.id
    );

    // Update parsed_data summary
    await serviceClient
      .from("lab_reports")
      .update({
        parsed_data: {
          ...parsedData,
          biomarker_summary: {
            total: result.totalCount,
            matched: result.matchedCount,
            flagged: result.flaggedCount,
          },
        },
      })
      .eq("id", reportId);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "generate",
      resourceType: "lab_report",
      resourceId: reportId,
      detail: {
        action: "recalculate_ranges",
        biomarkers_total: result.totalCount,
        biomarkers_matched: result.matchedCount,
        biomarkers_flagged: result.flaggedCount,
      },
    });

    return NextResponse.json({
      message: "Biomarker ranges recalculated",
      total: result.totalCount,
      matched: result.matchedCount,
      flagged: result.flaggedCount,
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage/lab-reports";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/labs/[id] — Get single lab report with biomarker results ──
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Fetch lab report with ownership check
    const { data: report, error } = await supabase
      .from("lab_reports")
      .select("*, patients(first_name, last_name, date_of_birth, sex)")
      .eq("id", reportId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (error || !report) return jsonError("Lab report not found", 404);

    // Fetch biomarker results
    const { data: biomarkers } = await supabase
      .from("biomarker_results")
      .select("*")
      .eq("lab_report_id", reportId)
      .order("category", { ascending: true })
      .order("biomarker_name", { ascending: true });

    // Generate signed URL for the original PDF
    let pdfUrl: string | null = null;
    if (report.raw_file_url) {
      try {
        pdfUrl = await getSignedUrl(report.raw_file_url, 3600);
      } catch {
        // Non-fatal — PDF viewing is optional
      }
    }

    return NextResponse.json({
      report,
      biomarkers: biomarkers || [],
      pdfUrl,
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, deleteFromStorage } from "@/lib/storage/lab-reports";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/labs/[id] — Get single lab report with biomarker results ──
export async function GET(
  request: NextRequest,
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
      .select("id, practitioner_id, patient_id, visit_id, lab_vendor, test_type, test_name, collection_date, raw_file_url, raw_file_name, raw_file_size, status, error_message, parsing_model, parsing_confidence, created_at, updated_at, patients(first_name, last_name, date_of_birth, sex)")
      .eq("id", reportId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (error || !report) return jsonError("Lab report not found", 404);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "lab_report",
      resourceId: reportId,
    });

    // Fetch biomarker results
    const { data: biomarkers } = await supabase
      .from("biomarker_results")
      .select("id, biomarker_code, biomarker_name, category, value, unit, conventional_low, conventional_high, conventional_flag, functional_low, functional_high, functional_flag, interpretation, clinical_significance, collection_date")
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

// ── DELETE /api/labs/[id] — Delete a lab report and its biomarker results ──
export async function DELETE(
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

    // Verify ownership
    const { data: report } = await supabase
      .from("lab_reports")
      .select("id, raw_file_url")
      .eq("id", reportId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!report) return jsonError("Lab report not found", 404);

    // Delete file from storage (non-fatal if already removed)
    if (report.raw_file_url) {
      try {
        await deleteFromStorage(report.raw_file_url);
      } catch {
        // Storage deletion is non-fatal
      }
    }

    // Delete biomarker results first (FK constraint)
    await supabase
      .from("biomarker_results")
      .delete()
      .eq("lab_report_id", reportId);

    // Delete the lab report record
    const { error: deleteError } = await supabase
      .from("lab_reports")
      .delete()
      .eq("id", reportId);

    if (deleteError) return jsonError("Failed to delete lab report", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "delete",
      resourceType: "lab_report",
      resourceId: reportId,
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

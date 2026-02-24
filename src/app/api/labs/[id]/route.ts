import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, deleteFromStorage } from "@/lib/storage/lab-reports";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { patchLabSchema } from "@/lib/validations/lab";

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
      .select("id, practitioner_id, patient_id, visit_id, lab_vendor, test_type, test_name, collection_date, raw_file_url, raw_file_name, raw_file_size, parsed_data, status, error_message, parsing_model, parsing_confidence, created_at, updated_at, patients(first_name, last_name, date_of_birth, sex)")
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

// ── PATCH /api/labs/[id] — Archive or unarchive a lab report ──
export async function PATCH(
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

    const body = await request.json();
    const parsedBody = patchLabSchema.safeParse(body);
    if (!parsedBody.success) return jsonError(parsedBody.error.issues[0].message, 400);

    const updates: Record<string, unknown> = {};

    if (parsedBody.data.is_archived !== undefined) {
      updates.is_archived = parsedBody.data.is_archived;
    }

    if ("patient_id" in parsedBody.data) {
      const patientId = parsedBody.data.patient_id ?? null;
      // Verify patient ownership if non-null
      if (patientId !== null) {
        const { data: patient } = await supabase
          .from("patients")
          .select("id")
          .eq("id", patientId)
          .eq("practitioner_id", practitioner.id)
          .single();
        if (!patient) return jsonError("Patient not found", 404);
      }
      updates.patient_id = patientId;
    }

    const { error: updateError } = await supabase
      .from("lab_reports")
      .update(updates)
      .eq("id", reportId)
      .eq("practitioner_id", practitioner.id);

    if (updateError) return jsonError("Failed to update lab report", 500);

    // When assigning/unassigning a patient, sync biomarker_results.patient_id
    if ("patient_id" in parsedBody.data) {
      await supabase
        .from("biomarker_results")
        .update({ patient_id: parsedBody.data.patient_id ?? null })
        .eq("lab_report_id", reportId);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: parsedBody.data.is_archived !== undefined
        ? (parsedBody.data.is_archived ? "archive" : "unarchive")
        : "update",
      resourceType: "lab_report",
      resourceId: reportId,
      detail: "patient_id" in parsedBody.data
        ? { patient_assigned: true, patient_id: parsedBody.data.patient_id }
        : undefined,
    });

    return NextResponse.json({ success: true, ...updates });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

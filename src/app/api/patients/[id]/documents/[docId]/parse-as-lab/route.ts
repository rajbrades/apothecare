import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseLabReport } from "@/lib/ai/lab-parsing";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — Claude Vision PDF parsing can be slow

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/patients/[id]/documents/[docId]/parse-as-lab ──────────────
// Creates a lab_report from an uploaded document and triggers biomarker parsing.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, docId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Fetch the document
    const { data: document, error: docError } = await supabase
      .from("patient_documents")
      .select("id, patient_id, file_name, file_size, storage_path, document_type, file_type")
      .eq("id", docId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (docError || !document) return jsonError("Document not found", 404);

    if (!document.storage_path) {
      return jsonError("Document has no file to parse", 400);
    }

    // Check if already parsed — return existing lab report
    const { data: existingLab } = await supabase
      .from("lab_reports")
      .select("id, status, test_name, lab_vendor, test_type, raw_file_name, raw_file_size, error_message, is_archived, created_at, collection_date")
      .eq("source_document_id", docId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (existingLab) {
      return NextResponse.json({ labReport: existingLab, existing: true });
    }

    // Create lab_report record reusing the document's storage file
    const { data: labReport, error: insertError } = await supabase
      .from("lab_reports")
      .insert({
        practitioner_id: practitioner.id,
        patient_id: patientId,
        lab_vendor: "other",
        test_type: "other",
        raw_file_url: document.storage_path,
        raw_file_name: document.file_name,
        raw_file_size: document.file_size,
        parsed_data: {},
        status: "uploading",
        source_document_id: docId,
      })
      .select("id, status, test_name, lab_vendor, test_type, raw_file_name, raw_file_size, error_message, is_archived, created_at, collection_date")
      .single();

    if (insertError || !labReport) {
      console.error("Lab report insert error:", insertError);
      return jsonError("Failed to create lab report", 500);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "lab_report",
      resourceId: labReport.id,
      detail: {
        patient_id: patientId,
        source_document_id: docId,
        action: "parse_as_lab",
      },
    });

    // Fire-and-forget lab parsing
    parseLabReport(
      labReport.id,
      document.storage_path,
      practitioner.id,
      patientId
    ).catch((err) => {
      console.error("Lab parsing from document failed:", err);
    });

    return NextResponse.json({ labReport }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

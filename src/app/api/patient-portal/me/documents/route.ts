import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { buildStoragePath, uploadToStorage } from "@/lib/storage/patient-documents";
import { extractDocumentContent } from "@/lib/ai/document-extraction";
import { parseLabReport } from "@/lib/ai/lab-parsing";
import { sanitizeFilename } from "@/lib/sanitize";
import { auditLog } from "@/lib/api/audit";

export const runtime = "nodejs";
export const maxDuration = 300;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "lab_report",
  "imaging",
  "outside_encounter_note",
  "insurance",
  "other",
] as const;

/**
 * GET /api/patient-portal/me/documents
 * Returns documents uploaded by the patient.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, practitioner_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!patient) return jsonError("Patient not found", 404);

  const { data: documents } = await supabase
    .from("patient_documents")
    .select("id, title, document_type, status, file_name, file_size, uploaded_at, created_at")
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ documents: documents || [] });
}

/**
 * POST /api/patient-portal/me/documents
 * Patient uploads a document (lab report, imaging, etc.)
 */
export async function POST(request: NextRequest) {
  try {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, practitioner_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!patient) return jsonError("Patient not found", 404);

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return jsonError("No file provided", 400);

  if (file.type !== "application/pdf") {
    return jsonError("Only PDF files are accepted", 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    return jsonError("File size exceeds 10MB limit", 400);
  }

  const documentType = (formData.get("document_type") as string) || "other";
  if (!ALLOWED_TYPES.includes(documentType as typeof ALLOWED_TYPES[number])) {
    return jsonError("Invalid document type", 400);
  }

  const title = (formData.get("title") as string) || file.name.replace(/\.pdf$/i, "");

  const service = createServiceClient();

  // Create document record
  const { data: document, error: insertError } = await service
    .from("patient_documents")
    .insert({
      practitioner_id: patient.practitioner_id,
      patient_id: patient.id,
      file_name: sanitizeFilename(file.name),
      file_size: file.size,
      file_type: file.type,
      storage_path: "",
      document_type: documentType,
      title,
      status: "uploading",
    })
    .select("id")
    .single();

  if (insertError || !document) {
    console.error("[patient-portal/documents] Insert failed:", insertError?.message);
    return jsonError("Failed to create document record", 500);
  }

  // Upload to storage
  const storagePath = buildStoragePath(patient.practitioner_id, patient.id, document.id, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadToStorage(storagePath, buffer, file.type);
  } catch {
    await service.from("patient_documents").delete().eq("id", document.id);
    return jsonError("Failed to upload file", 500);
  }

  // Update record with storage path
  await service
    .from("patient_documents")
    .update({ storage_path: storagePath, status: "uploaded" })
    .eq("id", document.id);

  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "upload",
    resourceType: "patient_document",
    resourceId: document.id,
    detail: { patient_id: patient.id, file_name: file.name, document_type: documentType, source: "patient_portal" },
  });

  // Extract document content (synchronous — Vercel constraint)
  try {
    await extractDocumentContent(document.id, storagePath, patient.practitioner_id, patient.id);
  } catch (err) {
    console.error("Patient document extraction failed:", err);
  }

  // Auto-parse as lab when type is lab_report
  let labReportId: string | null = null;
  if (documentType === "lab_report") {
    try {
      const { data: labReport } = await service
        .from("lab_reports")
        .insert({
          practitioner_id: patient.practitioner_id,
          patient_id: patient.id,
          lab_vendor: "other",
          test_type: "blood_panel",
          raw_file_url: storagePath,
          raw_file_name: sanitizeFilename(file.name),
          raw_file_size: file.size,
          status: "uploading",
          source_document_id: document.id,
        })
        .select("id")
        .single();

      if (labReport) {
        labReportId = labReport.id;
        await parseLabReport(labReport.id, storagePath, patient.practitioner_id, patient.id);
      }
    } catch (err) {
      console.error("Auto lab parsing failed (non-blocking):", err);
    }
  }

  // Re-fetch final status
  const { data: finalDoc } = await service
    .from("patient_documents")
    .select("id, title, document_type, status, file_name, uploaded_at")
    .eq("id", document.id)
    .single();

  return NextResponse.json({
    document: finalDoc || { id: document.id, title, document_type: documentType, status: "uploaded", file_name: file.name, uploaded_at: new Date().toISOString() },
    lab_report_id: labReportId,
  }, { status: 201 });
  } catch (err) {
    console.error("[patient-portal/documents] Unhandled error:", err);
    return jsonError("Internal server error", 500);
  }
}

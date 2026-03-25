import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadDocumentSchema, documentListQuerySchema } from "@/lib/validations/document";
import { buildStoragePath, uploadToStorage } from "@/lib/storage/patient-documents";
import { buildLabStoragePath, uploadToStorage as uploadLabToStorage } from "@/lib/storage/lab-reports";
import { extractDocumentContent } from "@/lib/ai/document-extraction";
import { parseLabReport } from "@/lib/ai/lab-parsing";
import { validateCsrf } from "@/lib/api/csrf";
import { sanitizeFilename } from "@/lib/sanitize";
import { auditLog } from "@/lib/api/audit";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — Claude document extraction can be slow

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── GET /api/patients/[id]/documents — List documents ───────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Verify patient ownership
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (patientError || !patient) {
      console.error("[GET documents] Patient lookup failed:", patientError?.message);
      return jsonError("Patient not found", 404);
    }

    const queryParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = documentListQuerySchema.safeParse(queryParams);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { status, document_type, limit } = parsed.data;

    let query = supabase
      .from("patient_documents")
      .select("id, file_name, file_size, file_type, document_type, document_date, title, status, error_message, uploaded_at, extracted_at, created_at")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .order("uploaded_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);
    if (document_type) query = query.eq("document_type", document_type);

    const { data: documents, error } = await query;
    if (error) return jsonError("Failed to fetch documents", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "patient_document",
      detail: { patient_id: patientId, list: true, count: documents?.length || 0 },
    });

    return NextResponse.json({ documents: documents || [] });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── POST /api/patients/[id]/documents — Upload a document ───────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, daily_query_count, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Verify patient ownership before consuming a query credit
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (patientError || !patient) {
      console.error("[POST documents] Patient lookup failed:", patientError?.message);
      return jsonError("Patient not found", 404);
    }

    // Check query limits (AI extraction counts as a query)
    const { data: allowed } = await supabase.rpc(
      "check_and_increment_query",
      { p_practitioner_id: practitioner.id }
    );

    if (!allowed) {
      return jsonError(
        `Daily query limit reached (${practitioner.subscription_tier === "free" ? 2 : "unlimited"}). Upgrade to Pro for unlimited uploads.`,
        429
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return jsonError("No file provided", 400);

    // Validate file
    if (file.type !== "application/pdf") {
      return jsonError("Only PDF files are accepted", 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File size exceeds 10MB limit", 400);
    }

    // Parse metadata
    const metadata = {
      document_type: formData.get("document_type") as string || "other",
      title: formData.get("title") as string || undefined,
      document_date: formData.get("document_date") as string || undefined,
    };
    const parsed = uploadDocumentSchema.safeParse(metadata);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    // Create document record
    const { data: document, error: insertError } = await supabase
      .from("patient_documents")
      .insert({
        practitioner_id: practitioner.id,
        patient_id: patientId,
        file_name: sanitizeFilename(file.name),
        file_size: file.size,
        file_type: file.type,
        storage_path: "", // Will update after upload
        document_type: parsed.data.document_type,
        title: parsed.data.title || file.name.replace(/\.pdf$/i, ""),
        document_date: parsed.data.document_date || null,
        status: "uploading",
      })
      .select()
      .single();

    if (insertError || !document) return jsonError("Failed to create document record", 500);

    // Upload to storage
    const storagePath = buildStoragePath(practitioner.id, patientId, document.id, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await uploadToStorage(storagePath, buffer, file.type);
    } catch {
      // Clean up the DB record on upload failure
      await supabase.from("patient_documents").delete().eq("id", document.id);
      return jsonError("Failed to upload file", 500);
    }

    // Update record with storage path and status
    await supabase
      .from("patient_documents")
      .update({ storage_path: storagePath, status: "uploaded" })
      .eq("id", document.id);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "upload",
      resourceType: "patient_document",
      resourceId: document.id,
      detail: { patient_id: patientId, file_name: file.name, file_size: file.size, document_type: parsed.data.document_type },
    });

    // Extract synchronously — fire-and-forget is unreliable on Vercel (function freezes after response)
    try {
      await extractDocumentContent(document.id, storagePath, practitioner.id, patientId);
    } catch (err) {
      console.error("Document extraction failed:", err);
    }

    // Auto-parse as lab when document type is "lab_report"
    // Creates a lab_reports row and runs full biomarker extraction so
    // biomarkers appear in Trends without a manual "Parse as Lab" step.
    let labReportId: string | null = null;
    if (parsed.data.document_type === "lab_report") {
      try {
        const { createServiceClient } = await import("@/lib/supabase/server");
        const service = createServiceClient();

        const { data: labReport } = await service
          .from("lab_reports")
          .insert({
            practitioner_id: practitioner.id,
            patient_id: patientId,
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
          await parseLabReport(labReport.id, storagePath, practitioner.id, patientId);
        }
      } catch (err) {
        console.error("Auto lab parsing failed (non-blocking):", err);
      }
    }

    // Re-fetch to get final status after extraction
    const { data: finalDoc } = await supabase
      .from("patient_documents")
      .select("id, title, document_type, status, extraction_summary, created_at")
      .eq("id", document.id)
      .single();

    return NextResponse.json({
      document: finalDoc || { ...document, storage_path: storagePath },
      lab_report_id: labReportId,
    }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

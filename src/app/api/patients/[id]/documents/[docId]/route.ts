import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, deleteFromStorage } from "@/lib/storage/patient-documents";
import { rebuildPatientClinicalSummary } from "@/lib/ai/clinical-summary";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/patients/[id]/documents/[docId] — Single document ──────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: patientId, docId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const { data: document, error } = await supabase
      .from("patient_documents")
      .select("id, patient_id, file_name, file_size, file_type, storage_path, document_type, document_date, title, status, extracted_text, extracted_data, extraction_summary, error_message, uploaded_at, extracted_at")
      .eq("id", docId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (error || !document) return jsonError("Document not found", 404);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "patient_document",
      resourceId: docId,
      detail: { patient_id: patientId },
    });

    // Generate signed URL for PDF viewing
    let signedUrl: string | null = null;
    if (document.storage_path) {
      try {
        signedUrl = await getSignedUrl(document.storage_path);
      } catch {
        // Non-fatal: URL generation failed
      }
    }

    return NextResponse.json({ document, signedUrl });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── PATCH /api/patients/[id]/documents/[docId] — Update document ──────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, docId } = await params;
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

    const VALID_DOC_TYPES = ["intake_form", "health_history", "lab_report", "imaging", "referral", "consent", "insurance", "other"];
    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) return jsonError("Title cannot be empty", 400);
      if (title.length > 255) return jsonError("Title must be 255 characters or fewer", 400);
      updates.title = title;
    }

    if (typeof body.document_type === "string") {
      if (!VALID_DOC_TYPES.includes(body.document_type)) {
        return jsonError("Invalid document type", 400);
      }
      updates.document_type = body.document_type;
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No valid fields to update", 400);
    }

    const { data: document, error } = await supabase
      .from("patient_documents")
      .update(updates)
      .eq("id", docId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .select("id, title, document_type")
      .single();

    if (error || !document) return jsonError("Document not found", 404);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "patient_document",
      resourceId: docId,
      detail: { patient_id: patientId, ...updates },
    });

    return NextResponse.json({ document });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── DELETE /api/patients/[id]/documents/[docId] — Delete document ────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, docId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Fetch document for storage path
    const { data: document } = await supabase
      .from("patient_documents")
      .select("id, storage_path")
      .eq("id", docId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!document) return jsonError("Document not found", 404);

    // Delete from storage
    if (document.storage_path) {
      try {
        await deleteFromStorage(document.storage_path);
      } catch {
        // Non-fatal: file may already be removed
      }
    }

    // Delete DB record
    await supabase.from("patient_documents").delete().eq("id", docId);

    // Rebuild clinical summary
    rebuildPatientClinicalSummary(patientId, practitioner.id).catch((err) => {
      console.error("Clinical summary rebuild failed:", err);
    });

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "delete",
      resourceType: "patient_document",
      resourceId: docId,
      detail: { patient_id: patientId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

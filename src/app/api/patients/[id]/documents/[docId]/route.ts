import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getSignedUrl, deleteFromStorage } from "@/lib/storage/patient-documents";
import { rebuildPatientClinicalSummary } from "@/lib/ai/clinical-summary";
import { validateCsrf } from "@/lib/api/csrf";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/patients/[id]/documents/[docId] — Single document ──────────
export async function GET(
  _request: NextRequest,
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
      .select("*")
      .eq("id", docId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (error || !document) return jsonError("Document not found", 404);

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
    const serviceClient = createServiceClient();

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

    // Audit log
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await serviceClient.from("audit_logs").insert({
      practitioner_id: practitioner.id,
      action: "delete",
      resource_type: "patient_document",
      resource_id: docId,
      ip_address: clientIp,
      user_agent: userAgent,
      detail: { patient_id: patientId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

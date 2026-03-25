import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractDocumentContent } from "@/lib/ai/document-extraction";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — Claude document extraction

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/patients/[id]/documents/[docId]/retry — Re-extract document ──
export async function POST(
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

    const { data: document, error: docError } = await supabase
      .from("patient_documents")
      .select("id, patient_id, storage_path, status")
      .eq("id", docId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (docError || !document) return jsonError("Document not found", 404);

    if (!document.storage_path) {
      return jsonError("Document has no file to extract", 400);
    }

    if (document.status === "extracting") {
      return jsonError("Document is already being extracted", 409);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "retry_extraction",
      resourceType: "patient_document",
      resourceId: docId,
      detail: { patient_id: patientId, previous_status: document.status },
    });

    // Fire-and-forget re-extraction
    extractDocumentContent(document.id, document.storage_path, practitioner.id, patientId).catch((err) => {
      console.error("Document re-extraction failed:", err);
    });

    return NextResponse.json({ success: true, status: "extracting" });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

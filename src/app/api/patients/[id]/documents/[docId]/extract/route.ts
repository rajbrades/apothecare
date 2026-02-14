import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractDocumentContent } from "@/lib/ai/document-extraction";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/patients/[id]/documents/[docId]/extract — Re-trigger extraction
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
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const rateLimitError = await checkRateLimit(
      supabase, practitioner.id, practitioner.subscription_tier, "doc_extract"
    );
    if (rateLimitError) return rateLimitError;

    const { data: document } = await supabase
      .from("patient_documents")
      .select("id, storage_path, status")
      .eq("id", docId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!document) return jsonError("Document not found", 404);
    if (document.status === "extracting") {
      return jsonError("Extraction already in progress", 409);
    }

    // Fire-and-forget extraction
    extractDocumentContent(document.id, document.storage_path, practitioner.id, patientId).catch((err) => {
      console.error("Document re-extraction failed:", err);
    });

    return NextResponse.json({ message: "Extraction started" });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

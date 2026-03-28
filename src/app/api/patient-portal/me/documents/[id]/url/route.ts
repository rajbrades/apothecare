import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage/patient-documents";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me/documents/[id]/url
 * Returns a time-limited signed URL for a patient's uploaded document.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, practitioner_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!patient) return jsonError("Patient not found", 404);

  // Fetch document using service client (RLS only allows practitioners)
  const service = createServiceClient();
  const { data: doc } = await service
    .from("patient_documents")
    .select("id, storage_path, file_name, patient_id")
    .eq("id", id)
    .eq("patient_id", patient.id)
    .single();

  if (!doc) return jsonError("Document not found", 404);

  // Intake form submissions don't have real storage files
  if (!doc.storage_path || doc.storage_path.startsWith("intake-submissions/")) {
    return jsonError("This document does not have a downloadable file", 404);
  }

  try {
    const url = await getSignedUrl(doc.storage_path, 3600);

    auditLog({
      request,
      practitionerId: patient.practitioner_id,
      action: "read",
      resourceType: "patient_document",
      resourceId: id,
      detail: { patient_id: patient.id, via: "patient_portal" },
    });

    return NextResponse.json({ url });
  } catch {
    return jsonError("Failed to generate download URL", 500);
  }
}

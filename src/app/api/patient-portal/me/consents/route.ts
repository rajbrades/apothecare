import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me/consents
 * Returns required consent templates and which ones the patient has signed.
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

  const [{ data: templates }, { data: signatures }] = await Promise.all([
    supabase
      .from("consent_templates")
      .select("id, document_type, version, title, content_markdown, is_required")
      .eq("is_required", true)
      .eq("is_active", true)
      .or(`practitioner_id.is.null,practitioner_id.eq.${patient.practitioner_id}`)
      .order("document_type"),
    supabase
      .from("patient_consent_signatures")
      .select("consent_template_id, signed_at, signed_name")
      .eq("patient_id", patient.id),
  ]);

  const signedMap = new Map(
    (signatures || []).map((s: { consent_template_id: string; signed_at: string; signed_name: string }) => [
      s.consent_template_id,
      { signed_at: s.signed_at, signed_name: s.signed_name },
    ])
  );

  const consents = (templates || []).map((t: { id: string; [key: string]: unknown }) => ({
    ...t,
    signed: signedMap.has(t.id),
    signed_at: signedMap.get(t.id)?.signed_at ?? null,
    signed_name: signedMap.get(t.id)?.signed_name ?? null,
  }));

  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "read",
    resourceType: "consent",
    detail: { via: "patient_portal", count: consents.length },
  });

  return NextResponse.json({ consents });
}

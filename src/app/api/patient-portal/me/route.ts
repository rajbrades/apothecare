import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me
 * Returns the current patient's profile + onboarding status.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name, last_name, portal_status, practitioner_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!patient) return jsonError("Patient record not found", 404);

  // Check onboarding status: consents signed + intake submitted
  const [{ data: signatures }, { data: intake }] = await Promise.all([
    supabase
      .from("patient_consent_signatures")
      .select("consent_template_id")
      .eq("patient_id", patient.id),
    supabase
      .from("patient_intake_submissions")
      .select("id")
      .eq("patient_id", patient.id)
      .order("submitted_at", { ascending: false })
      .limit(1),
  ]);

  // Required consents: active required templates (platform defaults + practitioner's)
  const { data: requiredTemplates } = await supabase
    .from("consent_templates")
    .select("id")
    .eq("is_required", true)
    .eq("is_active", true)
    .or(`practitioner_id.is.null,practitioner_id.eq.${patient.practitioner_id}`);

  const signedIds = new Set((signatures || []).map((s: { consent_template_id: string }) => s.consent_template_id));
  const allConsentsSigned = (requiredTemplates || []).every((t: { id: string }) => signedIds.has(t.id));
  const intakeSubmitted = (intake || []).length > 0;

  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "read",
    resourceType: "patient",
    resourceId: patient.id,
    detail: { via: "patient_portal", endpoint: "me" },
  });

  return NextResponse.json({
    patient,
    onboarding: {
      consents_complete: allConsentsSigned,
      intake_complete: intakeSubmitted,
      complete: allConsentsSigned && intakeSubmitted,
    },
  });
}

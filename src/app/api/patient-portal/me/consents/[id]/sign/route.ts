import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const schema = z.object({
  signed_name: z.string().min(2, "Full legal name is required"),
});

/**
 * POST /api/patient-portal/me/consents/[id]/sign
 * Sign a consent template. Idempotent — re-signing is allowed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { id: templateId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, practitioner_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!patient) return jsonError("Patient not found", 404);

  // Verify template exists and is accessible
  const { data: template } = await supabase
    .from("consent_templates")
    .select("id, version, title")
    .eq("id", templateId)
    .eq("is_active", true)
    .single();

  if (!template) return jsonError("Consent template not found", 404);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = request.headers.get("user-agent") || null;

  const service = createServiceClient();
  const { data: sig, error } = await service
    .from("patient_consent_signatures")
    .insert({
      practitioner_id: patient.practitioner_id,
      patient_id: patient.id,
      consent_template_id: templateId,
      template_version: template.version,
      signed_name: parsed.data.signed_name,
      signature_method: "typed_ack",
      signed_at: new Date().toISOString(),
      ip_address: ip,
      user_agent: userAgent,
    })
    .select("id, signed_at")
    .single();

  if (error || !sig) return jsonError("Failed to record signature", 500);

  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "consent_signed",
    resourceType: "consent_signature",
    resourceId: sig.id,
    detail: {
      patient_id: patient.id,
      template_id: templateId,
      template_version: template.version,
    },
  });

  return NextResponse.json({ signature_id: sig.id, signed_at: sig.signed_at });
}

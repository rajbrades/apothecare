import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me/intake
 * Returns the active intake form template for the patient's practice.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, practitioner_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!patient) return jsonError("Patient not found", 404);

  // Prefer practitioner-specific template, fall back to global default
  const { data: templates } = await supabase
    .from("intake_form_templates")
    .select("id, version, title, schema_json, practitioner_id")
    .eq("is_active", true)
    .or(`practitioner_id.is.null,practitioner_id.eq.${patient.practitioner_id}`)
    .order("practitioner_id", { ascending: false }) // practitioner-specific first
    .limit(1);

  const template = templates?.[0] ?? null;
  if (!template) return jsonError("No intake form available", 404);

  // Check if patient already submitted
  const { data: existing } = await supabase
    .from("patient_intake_submissions")
    .select("id, submitted_at")
    .eq("patient_id", patient.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ template, already_submitted: !!existing, submitted_at: existing?.submitted_at ?? null });
}

const submitSchema = z.object({
  template_id: z.string().uuid(),
  responses: z.record(z.unknown()),
});

/**
 * POST /api/patient-portal/me/intake
 * Submit intake form. Maps responses to patient record fields.
 */
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, practitioner_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!patient) return jsonError("Patient not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

  const { template_id, responses } = parsed.data;

  const { data: template } = await supabase
    .from("intake_form_templates")
    .select("id, version, schema_json")
    .eq("id", template_id)
    .eq("is_active", true)
    .single();

  if (!template) return jsonError("Template not found", 404);

  // Map responses to patient record fields
  const schemaFields = template.schema_json as Array<{
    key: string;
    maps_to?: string;
    type?: string;
  }>;

  const mappedFields: Record<string, unknown> = {};
  const patientUpdates: Record<string, unknown> = {};

  const ALLOWED_PATIENT_FIELDS = new Set([
    "chief_complaints", "medical_history", "current_medications",
    "supplements", "allergies", "notes",
  ]);

  for (const field of schemaFields) {
    if (!field.maps_to) continue;
    const value = responses[field.key];
    if (value === undefined || value === null || value === "") continue;

    if (ALLOWED_PATIENT_FIELDS.has(field.maps_to)) {
      // chief_complaints and allergies are arrays
      if (field.maps_to === "chief_complaints" || field.maps_to === "allergies") {
        patientUpdates[field.maps_to] = typeof value === "string"
          ? value.split(",").map((s: string) => s.trim()).filter(Boolean)
          : value;
      } else {
        patientUpdates[field.maps_to] = value;
      }
      mappedFields[field.maps_to] = patientUpdates[field.maps_to];
    }
  }

  const service = createServiceClient();

  // Insert submission
  const { data: submission, error } = await service
    .from("patient_intake_submissions")
    .insert({
      practitioner_id: patient.practitioner_id,
      patient_id: patient.id,
      template_id,
      template_version: template.version,
      responses_json: responses,
      mapped_fields_json: mappedFields,
      submitted_at: new Date().toISOString(),
    })
    .select("id, submitted_at")
    .single();

  if (error || !submission) return jsonError("Failed to save intake", 500);

  // Update patient record with mapped fields (best-effort)
  if (Object.keys(patientUpdates).length > 0) {
    await service
      .from("patients")
      .update(patientUpdates)
      .eq("id", patient.id);
  }

  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "intake_submitted",
    resourceType: "intake_submission",
    resourceId: submission.id,
    detail: { patient_id: patient.id, template_id },
  });

  return NextResponse.json({ submission_id: submission.id, submitted_at: submission.submitted_at });
}

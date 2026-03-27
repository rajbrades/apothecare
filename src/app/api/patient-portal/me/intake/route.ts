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
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, practitioner_id, first_name, last_name, date_of_birth, sex, email, phone, city, state, zip_code, gender_identity, ethnicity, referral_source")
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

  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "read",
    resourceType: "intake_template",
    detail: { via: "patient_portal", already_submitted: !!existing },
  });

  // Return patient data for pre-population + auth email
  const prefill = {
    first_name: patient.first_name ?? "",
    last_name: patient.last_name ?? "",
    date_of_birth: patient.date_of_birth ?? "",
    sex: patient.sex ?? "",
    email: patient.email || user.email || "",
    phone: patient.phone ?? "",
    city: patient.city ?? "",
    state: patient.state ?? "",
    zip_code: patient.zip_code ?? "",
    gender_identity: patient.gender_identity ?? "",
    ethnicity: patient.ethnicity ?? "",
    referral_source: patient.referral_source ?? "",
    auth_email: user.email || "",
  };

  return NextResponse.json({ template, prefill, already_submitted: !!existing, submitted_at: existing?.submitted_at ?? null });
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

  // Map intake responses to patient record fields
  const r = responses as Record<string, unknown>;
  const patientUpdates: Record<string, unknown> = {};

  // Helper: only set if value is non-empty
  const setIfPresent = (key: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== "") {
      patientUpdates[key] = value;
    }
  };

  // Demographics & Contact
  setIfPresent("email", r.email);
  setIfPresent("phone", r.phone);
  setIfPresent("address", r.address);
  // Support both new separate fields and legacy city_state
  if (r.city) {
    setIfPresent("city", r.city);
    setIfPresent("state", r.state);
  } else if (r.city_state && typeof r.city_state === "string") {
    const parts = r.city_state.split(",").map((s: string) => s.trim());
    setIfPresent("city", parts[0]);
    setIfPresent("state", parts[1]);
  }
  setIfPresent("zip_code", r.zip);
  setIfPresent("gender_identity", r.gender_identity);
  setIfPresent("ethnicity", r.ethnicity);
  setIfPresent("referral_source", r.referral);

  // Clinical
  if (r.reason_for_visit) {
    patientUpdates.chief_complaints = typeof r.reason_for_visit === "string"
      ? [r.reason_for_visit] : r.reason_for_visit;
  }
  if (Array.isArray(r.diagnoses) && r.diagnoses.length > 0) {
    patientUpdates.diagnoses = r.diagnoses;
    // Also append to medical_history text
    const diagText = (r.diagnoses as string[]).join(", ");
    const detail = r.diagnoses_detail || "";
    patientUpdates.medical_history = detail ? `${diagText}\n\n${detail}` : diagText;
  } else if (r.diagnoses_detail) {
    patientUpdates.medical_history = r.diagnoses_detail;
  }

  // Surgeries & Hospitalizations (dynamic rows → JSONB arrays)
  if (Array.isArray(r.surgeries)) {
    const filtered = (r.surgeries as string[][])
      .filter((row) => row[0]?.trim())
      .map((row) => ({ name: row[0], year: row[1] || "" }));
    if (filtered.length > 0) patientUpdates.surgeries = filtered;
  }
  if (Array.isArray(r.hospitalizations)) {
    const filtered = (r.hospitalizations as string[][])
      .filter((row) => row[0]?.trim())
      .map((row) => ({ reason: row[0], year: row[1] || "" }));
    if (filtered.length > 0) patientUpdates.hospitalizations = filtered;
  }

  // Medications (dynamic rows → structured records for patient_medications table)
  const intakeMedications: Array<{ name: string; dosage: string; form: string; frequency: string; route: string }> = [];
  if (Array.isArray(r.medications)) {
    for (const row of r.medications as string[][]) {
      if (!row[0]?.trim()) continue;
      intakeMedications.push({
        name: row[0],
        dosage: row[1] || "",
        form: row[2] || "",
        frequency: row[3] || "",
        route: row[4] || "",
      });
    }
    // Also store as text for the legacy current_medications field
    if (intakeMedications.length > 0) {
      const medsText = intakeMedications
        .map((m) => [m.name, m.dosage, m.form, m.frequency, m.route].filter(Boolean).join(" — "))
        .join("\n");
      setIfPresent("current_medications", medsText);
    }
  }

  // Allergies (dynamic rows → text array)
  if (Array.isArray(r.allergies_list)) {
    const allergies = (r.allergies_list as string[][])
      .filter((row) => row[0]?.trim())
      .map((row) => [row[0], row[1]].filter(Boolean).join(" (") + (row[1] ? ")" : ""));
    if (allergies.length > 0) patientUpdates.allergies = allergies;
  }

  // Supplements (dynamic rows → structured records for patient_supplements table)
  const intakeSupplements: Array<{ name: string; dosage: string; form: string; frequency: string; timing: string; brand: string }> = [];
  if (Array.isArray(r.supplements)) {
    for (const row of r.supplements as string[][]) {
      if (!row[0]?.trim()) continue;
      intakeSupplements.push({
        name: row[0],
        dosage: row[1] || "",
        form: row[2] || "",
        frequency: row[3] || "",
        timing: row[4] || "",
        brand: row[5] || "",
      });
    }
    // Also store as text for the legacy supplements field
    if (intakeSupplements.length > 0) {
      const suppsText = intakeSupplements
        .map((s) => [s.brand, s.name, s.dosage, s.form, s.frequency, s.timing].filter(Boolean).join(" — "))
        .join("\n");
      setIfPresent("supplements", suppsText);
    }
  }

  // Family History
  if (Array.isArray(r.family_conditions) && r.family_conditions.length > 0) {
    patientUpdates.family_history_conditions = r.family_conditions;
  }
  setIfPresent("family_history_detail", r.family_detail);

  // Genetics
  setIfPresent("genetic_testing", r.genetic_testing);
  setIfPresent("apoe_genotype", r.apoe);
  setIfPresent("mthfr_variants", r.mthfr);

  // Symptom scores (all sym_* fields → JSONB)
  const symptomScores: Record<string, number> = {};
  for (const [key, val] of Object.entries(r)) {
    if (key.startsWith("sym_") && typeof val === "number" && val > 0) {
      symptomScores[key.replace("sym_", "")] = val;
    }
  }
  if (Object.keys(symptomScores).length > 0) {
    patientUpdates.symptom_scores = symptomScores;
  }
  setIfPresent("notes", r.top_3_symptoms);

  // Lifestyle (aggregate into JSONB)
  const lifestyle: Record<string, unknown> = {};
  const lifestyleKeys = [
    "diet_type", "meals_per_day", "skip_breakfast", "typical_day_eating",
    "sugar_intake", "water_intake", "exercise_freq", "exercise_type",
    "exercise_tolerance", "stress_level", "stressors", "stress_management",
    "alcohol", "caffeine", "tobacco", "cannabis", "other_substances",
    "env_exposures", "env_detail", "sleep_hours", "sleep_bedtime",
    "food_triggers",
  ];
  for (const key of lifestyleKeys) {
    const val = r[key];
    if (val !== undefined && val !== null && val !== "" &&
        !(Array.isArray(val) && val.length === 0)) {
      lifestyle[key] = val;
    }
  }
  if (Object.keys(lifestyle).length > 0) {
    patientUpdates.lifestyle = lifestyle;
  }

  // Prior labs & Goals
  if (Array.isArray(r.prior_labs) && r.prior_labs.length > 0) {
    patientUpdates.prior_labs = r.prior_labs;
  }
  setIfPresent("health_goals", r.health_goals);

  const mappedFields = { ...patientUpdates };

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

  // Insert structured medication records (best-effort)
  if (intakeMedications.length > 0) {
    await service.from("patient_medications").insert(
      intakeMedications.map((m, i) => ({
        patient_id: patient.id,
        practitioner_id: patient.practitioner_id,
        name: m.name,
        dosage: m.dosage || null,
        form: m.form || null,
        frequency: m.frequency || null,
        route: m.route || null,
        status: "active",
        source: "patient_reported",
        sort_order: i,
      }))
    );
  }

  // Insert structured supplement records (best-effort)
  if (intakeSupplements.length > 0) {
    await service.from("patient_supplements").insert(
      intakeSupplements.map((s, i) => ({
        patient_id: patient.id,
        practitioner_id: patient.practitioner_id,
        name: s.name,
        dosage: s.dosage || null,
        form: s.form || null,
        frequency: s.frequency || null,
        timing: s.timing || null,
        brand: s.brand || null,
        status: "active",
        source: "patient_reported",
        sort_order: i,
      }))
    );
  }

  // Create a patient_documents record so the intake appears in the Documents tab
  const now = new Date().toISOString();
  const summaryParts: string[] = [];
  if (r.first_name || r.last_name) summaryParts.push(`Patient: ${[r.first_name, r.last_name].filter(Boolean).join(" ")}`);
  if (r.reason_for_visit) summaryParts.push(`Reason for visit: ${r.reason_for_visit}`);
  if (Array.isArray(r.diagnoses) && r.diagnoses.length > 0) summaryParts.push(`Diagnoses: ${(r.diagnoses as string[]).join(", ")}`);
  if (intakeMedications.length > 0) summaryParts.push(`Medications: ${intakeMedications.map((m) => m.name).join(", ")}`);
  if (intakeSupplements.length > 0) summaryParts.push(`Supplements: ${intakeSupplements.map((s) => s.name).join(", ")}`);

  await service.from("patient_documents").insert({
    practitioner_id: patient.practitioner_id,
    patient_id: patient.id,
    file_name: "Patient Intake Questionnaire.pdf",
    file_size: 0,
    file_type: "application/json",
    storage_path: `intake-submissions/${submission.id}`,
    document_type: "intake_form",
    document_date: now,
    title: "New Patient Health Intake",
    status: "extracted",
    extracted_text: JSON.stringify(responses, null, 2),
    extracted_data: mappedFields,
    extraction_summary: summaryParts.join("\n") || "Patient intake form submitted via portal",
    uploaded_at: now,
    extracted_at: now,
  });

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

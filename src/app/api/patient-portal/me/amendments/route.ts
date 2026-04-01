import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";
import { z } from "zod";
import {
  sendAmendmentReceivedEmail,
  sendAmendmentAlertEmail,
} from "@/lib/email/amendment";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const AMENDABLE_FIELDS = [
  "first_name", "last_name", "email", "phone", "date_of_birth",
  "city", "state", "zip", "gender_identity", "ethnicity",
  "allergies", "medical_history", "current_medications", "other",
] as const;

export const FIELD_LABELS: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  email: "Email",
  phone: "Phone",
  date_of_birth: "Date of Birth",
  city: "City",
  state: "State",
  zip: "ZIP Code",
  gender_identity: "Gender Identity",
  ethnicity: "Ethnicity",
  allergies: "Allergies",
  medical_history: "Medical History",
  current_medications: "Current Medications",
  other: "Other",
};

const createAmendmentSchema = z.object({
  field_name: z.enum(AMENDABLE_FIELDS, {
    errorMap: () => ({ message: "Invalid field. Allowed: " + AMENDABLE_FIELDS.join(", ") }),
  }),
  current_value: z.string().max(2000).optional(),
  requested_value: z.string().min(1, "Description is required").max(2000),
  reason: z.string().min(5, "Please provide a reason (at least 5 characters)").max(1000),
});

/**
 * GET /api/patient-portal/me/amendments
 * List the patient's amendment requests.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: patient } = await supabase
      .from("patients")
      .select("id, practitioner_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!patient) return jsonError("Patient record not found", 404);

    const { data: amendments, error } = await supabase
      .from("amendment_requests")
      .select("id, field_name, current_value, requested_value, reason, status, reviewer_note, reviewed_at, created_at")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Amendments] DB Error:", error.message);
      return jsonError("Failed to fetch amendments", 500);
    }

    auditLog({
      request,
      practitionerId: patient.practitioner_id,
      action: "read",
      resourceType: "amendment_request",
      resourceId: patient.id,
      detail: { accessed_by: "patient" },
    });

    return NextResponse.json({ amendments: amendments || [] });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

/**
 * POST /api/patient-portal/me/amendments
 * Submit a new amendment request.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: patient } = await supabase
      .from("patients")
      .select("id, practitioner_id, first_name, last_name")
      .eq("auth_user_id", user.id)
      .single();

    if (!patient) return jsonError("Patient record not found", 404);

    const body = await request.json();
    const parsed = createAmendmentSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { data: amendment, error } = await supabase
      .from("amendment_requests")
      .insert({
        patient_id: patient.id,
        practitioner_id: patient.practitioner_id,
        field_name: parsed.data.field_name,
        current_value: parsed.data.current_value || null,
        requested_value: parsed.data.requested_value,
        reason: parsed.data.reason,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Amendments] Insert Error:", error.message);
      return jsonError("Failed to submit amendment request", 500);
    }

    auditLog({
      request,
      practitionerId: patient.practitioner_id,
      action: "create",
      resourceType: "amendment_request",
      resourceId: amendment?.id,
      detail: {
        patient_id: patient.id,
        field_name: parsed.data.field_name,
      },
    });

    // Send emails (non-blocking — don't fail the request if email fails)
    const fieldLabel = FIELD_LABELS[parsed.data.field_name] ?? parsed.data.field_name;
    const patientName = [
      (patient as { first_name?: string | null }).first_name,
      (patient as { last_name?: string | null }).last_name,
    ].filter(Boolean).join(" ") || "Patient";

    Promise.all([
      // Confirmation to patient
      sendAmendmentReceivedEmail({
        to: user.email!,
        patientFirstName: (patient as { first_name?: string | null }).first_name ?? null,
        fieldLabel,
        requestedValue: parsed.data.requested_value,
      }).catch((e: unknown) => console.error("[Amendments] Patient email error:", e)),

      // Alert to practitioner (if we can find their email)
      patient.practitioner_id
        ? supabase
            .from("practitioners")
            .select("first_name, email")
            .eq("id", patient.practitioner_id)
            .single()
            .then(({ data: prac }: { data: { first_name?: string | null; email?: string | null } | null }) => {
              if (!prac?.email) return;
              return sendAmendmentAlertEmail({
                to: prac.email,
                practitionerFirstName: prac.first_name ?? null,
                patientName,
                fieldLabel,
                requestedValue: parsed.data.requested_value,
                reason: parsed.data.reason,
                patientId: patient.id,
              });
            })
            .catch((e: unknown) => console.error("[Amendments] Practitioner email error:", e))
        : Promise.resolve(),
    ]);

    return NextResponse.json({ success: true, id: amendment?.id }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

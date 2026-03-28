import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/patients/[id]/repopulate-intake
 *
 * Re-applies mapped intake data from the most recent patient_intake_submissions
 * record to the patient's columns. Useful when intake was submitted before
 * migration 036 added the structured fields.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Unauthorized", 401);

    // Verify patient belongs to practitioner
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", id)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!patient) return jsonError("Patient not found", 404);

    const service = createServiceClient();

    // Get the most recent intake submission
    const { data: submission } = await service
      .from("patient_intake_submissions")
      .select("id, mapped_fields_json")
      .eq("patient_id", id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    if (!submission?.mapped_fields_json) {
      return jsonError("No intake submission found for this patient", 404);
    }

    const mapped = submission.mapped_fields_json as Record<string, unknown>;

    // Remove fields that shouldn't be overwritten (identity fields already correct)
    const skipFields = new Set(["first_name", "last_name", "date_of_birth", "sex", "email"]);
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(mapped)) {
      if (!skipFields.has(key) && value != null && value !== "") {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No fields to update from intake", 400);
    }

    const { error: updateError } = await service
      .from("patients")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      console.error("[repopulate-intake] Update failed:", updateError.message);
      return jsonError("Failed to update patient record", 500);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "patient",
      resourceId: id,
      detail: { source: "repopulate_intake", fields: Object.keys(updates) },
    });

    return NextResponse.json({
      success: true,
      fields_updated: Object.keys(updates),
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

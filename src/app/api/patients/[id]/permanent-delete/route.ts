import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { deleteStoragePrefix } from "@/lib/storage/patient-documents";
import { z } from "zod";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const permanentDeleteSchema = z.object({
  confirmation: z.string().min(1, "Confirmation text is required"),
});

// ── POST /api/patients/[id]/permanent-delete — Irreversible hard delete ──

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const supabase = await createClient();

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Unauthorized", 401);

    // Validate body
    const body = await request.json();
    const parsed = permanentDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    // Fetch patient to verify ownership and build expected confirmation
    const { data: patient, error: fetchError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, is_archived")
      .eq("id", id)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (fetchError || !patient) return jsonError("Patient not found", 404);

    // Patient must be archived before permanent deletion
    if (!patient.is_archived) {
      return jsonError("Patient must be archived before permanent deletion", 400);
    }

    // Verify confirmation string matches "FirstName LastName Delete"
    const patientName = [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "Unnamed Patient";
    const expectedConfirmation = `${patientName} Delete`;

    if (parsed.data.confirmation !== expectedConfirmation) {
      return jsonError(
        `Confirmation text must exactly match "${expectedConfirmation}"`,
        400
      );
    }

    // Use service client to bypass RLS for cascading delete
    const service = createServiceClient();

    // Delete storage files first (patient documents + lab PDFs)
    await deleteStoragePrefix(`${practitioner.id}/${id}/`);

    // Delete related records first, then the patient
    // Order matters due to FK constraints
    const deletions = [
      service.from("patient_supplements").delete().eq("patient_id", id),
      service.from("timeline_events").delete().eq("patient_id", id),
    ];
    await Promise.all(deletions);

    // Delete the patient row (remaining FKs should cascade or have been cleaned)
    const { error: deleteError } = await service
      .from("patients")
      .delete()
      .eq("id", id)
      .eq("practitioner_id", practitioner.id);

    if (deleteError) {
      console.error("[Patient Delete] Failed:", deleteError.message);
      return jsonError("Failed to permanently delete patient", 500);
    }

    // Audit log the permanent deletion
    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "delete",
      resourceType: "patient",
      resourceId: id,
      detail: {
        permanent: true,
        patient_name: patientName,
        confirmation_text: parsed.data.confirmation,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

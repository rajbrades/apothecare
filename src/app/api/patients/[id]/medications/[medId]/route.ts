import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { z } from "zod";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const updateMedicationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  dosage: z.string().max(100).nullable().optional(),
  frequency: z.string().max(100).nullable().optional(),
  route: z.string().max(50).nullable().optional(),
  form: z.string().max(50).nullable().optional(),
  prescriber: z.string().max(200).nullable().optional(),
  indication: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "discontinued", "as_needed"]).optional(),
  notes: z.string().max(1000).nullable().optional(),
  discontinued_at: z.string().nullable().optional(),
}).partial();

/**
 * PATCH /api/patients/[id]/medications/[medId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; medId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, medId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json().catch(() => null);
    const parsed = updateMedicationSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { data: medication, error } = await supabase
      .from("patient_medications")
      .update(parsed.data)
      .eq("id", medId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .select()
      .single();

    if (error) return jsonError("Internal server error", 500);
    if (!medication) return jsonError("Medication not found", 404);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "patient_medication",
      resourceId: medId,
    });

    return NextResponse.json({ medication });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE /api/patients/[id]/medications/[medId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; medId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, medId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Unauthorized", 401);

    const { error } = await supabase
      .from("patient_medications")
      .delete()
      .eq("id", medId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id);

    if (error) return jsonError("Internal server error", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "delete",
      resourceType: "patient_medication",
      resourceId: medId,
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { z } from "zod";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patients/[id]/amendments
 * List amendment requests for a specific patient (practitioner view).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { data: amendments, error } = await supabase
      .from("amendment_requests")
      .select("id, field_name, current_value, requested_value, reason, status, reviewer_note, reviewed_at, created_at")
      .eq("patient_id", id)
      .eq("practitioner_id", practitioner.id)
      .order("created_at", { ascending: false });

    if (error) return jsonError("Failed to fetch amendments", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "amendment_request",
      resourceId: id,
    });

    return NextResponse.json({ amendments: amendments || [] });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

const reviewSchema = z.object({
  amendment_id: z.string().uuid(),
  action: z.enum(["approved", "denied"]),
  reviewer_note: z.string().max(1000).optional(),
});

/**
 * POST /api/patients/[id]/amendments
 * Review (approve/deny) an amendment request.
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

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);

    const service = createServiceClient();

    // Verify the amendment belongs to this patient and practitioner
    const { data: amendment } = await service
      .from("amendment_requests")
      .select("id, field_name, requested_value, status")
      .eq("id", parsed.data.amendment_id)
      .eq("patient_id", id)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!amendment) return jsonError("Amendment request not found", 404);
    if ((amendment as { status: string }).status !== "pending") {
      return jsonError("Amendment has already been reviewed", 400);
    }

    // Update the amendment status
    const { error: updateError } = await service
      .from("amendment_requests")
      .update({
        status: parsed.data.action,
        reviewer_note: parsed.data.reviewer_note || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.amendment_id);

    if (updateError) return jsonError("Failed to update amendment", 500);

    // If approved, apply the change to the patient record
    if (parsed.data.action === "approved") {
      const fieldName = (amendment as { field_name: string }).field_name;
      const requestedValue = (amendment as { requested_value: string }).requested_value;

      await service
        .from("patients")
        .update({ [fieldName]: requestedValue })
        .eq("id", id);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "amendment_request",
      resourceId: parsed.data.amendment_id,
      detail: {
        patient_id: id,
        resolution: parsed.data.action,
        field_name: (amendment as { field_name: string }).field_name,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { z } from "zod";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const createMedicationSchema = z.object({
  name: z.string().min(1).max(200),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  route: z.string().max(50).optional(),
  form: z.string().max(50).optional(),
  prescriber: z.string().max(200).optional(),
  indication: z.string().max(500).optional(),
  status: z.enum(["active", "discontinued", "as_needed"]).default("active"),
  notes: z.string().max(1000).optional(),
});

/**
 * GET /api/patients/[id]/medications
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Unauthorized", 401);

    const includeDiscontinued = request.nextUrl.searchParams.get("include_discontinued") === "true";

    let query = supabase
      .from("patient_medications")
      .select("id, patient_id, practitioner_id, name, dosage, frequency, route, form, prescriber, indication, status, source, started_at, discontinued_at, notes, sort_order, created_at, updated_at")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!includeDiscontinued) {
      query = query.neq("status", "discontinued");
    }

    const { data, error } = await query;
    if (error) return jsonError("Internal server error", 500);

    return NextResponse.json({ medications: data });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

/**
 * POST /api/patients/[id]/medications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId } = await params;
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
    const parsed = createMedicationSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { data: medication, error } = await supabase
      .from("patient_medications")
      .insert({
        patient_id: patientId,
        practitioner_id: practitioner.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (error) return jsonError("Internal server error", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "patient_medication",
      resourceId: medication.id,
      detail: { patient_id: patientId, name: parsed.data.name },
    });

    return NextResponse.json({ medication }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

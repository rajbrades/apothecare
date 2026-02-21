import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { createPatientSupplementSchema } from "@/lib/validations/patient-supplement";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthPractitioner(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return practitioner;
}

// ── GET /api/patients/[id]/supplements — List supplements ─────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const includeDiscontinued = request.nextUrl.searchParams.get("include_discontinued") === "true";

    let query = supabase
      .from("patient_supplements")
      .select("*")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!includeDiscontinued) {
      query = query.eq("status", "active");
    }

    const { data, error } = await query;
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ supplements: data });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── POST /api/patients/[id]/supplements — Add supplement ──────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = createPatientSupplementSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { data, error } = await supabase
      .from("patient_supplements")
      .insert({
        patient_id: patientId,
        practitioner_id: practitioner.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 500);

    auditLog({
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "patient_supplement",
      resourceId: data.id,
      detail: { patient_id: patientId, supplement_name: parsed.data.name },
      request,
    });

    return NextResponse.json({ supplement: data }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

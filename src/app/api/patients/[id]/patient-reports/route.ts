import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { createPatientReportSchema } from "@/lib/validations/patient-report";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthPractitioner(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return practitioner;
}

// ── GET /api/patients/[id]/patient-reports ───────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const reportType = request.nextUrl.searchParams.get("report_type");

    let query = supabase
      .from("patient_reports")
      .select("id, patient_id, practitioner_id, report_type, title, content, severity, reported_date, related_supplement_id, visit_id, created_at, updated_at")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .order("reported_date", { ascending: false });

    if (reportType) {
      query = query.eq("report_type", reportType);
    }

    const { data, error } = await query;
    if (error) return jsonError("Internal server error", 500);

    return NextResponse.json({ reports: data });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── POST /api/patients/[id]/patient-reports ──────────────────────────

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
    const parsed = createPatientReportSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { data, error } = await supabase
      .from("patient_reports")
      .insert({
        patient_id: patientId,
        practitioner_id: practitioner.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (error) return jsonError("Internal server error", 500);

    auditLog({
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "patient_report",
      resourceId: data.id,
      detail: {
        patient_id: patientId,
        title: parsed.data.title,
        report_type: parsed.data.report_type,
      },
      request,
    });

    return NextResponse.json({ report: data }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

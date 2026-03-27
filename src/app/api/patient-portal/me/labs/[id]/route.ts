import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me/labs/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, practitioner_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!patient) return jsonError("Patient not found", 404);

  // Use service client — lab_reports RLS only allows practitioner access
  const service = createServiceClient();

  const { data: lab } = await service
    .from("lab_reports")
    .select("id, test_name, collection_date, lab_vendor, test_type, status, created_at, is_shared_with_patient")
    .eq("id", id)
    .eq("patient_id", patient.id)
    .eq("is_shared_with_patient", true)
    .single();

  if (!lab) return jsonError("Lab report not found", 404);
  const { data: biomarkers } = await service
    .from("biomarker_results")
    .select(`
      id, biomarker_code, biomarker_name, category, subcategory,
      value, unit,
      conventional_low, conventional_high, conventional_flag,
      functional_low, functional_high, functional_flag,
      interpretation
    `)
    .eq("lab_report_id", id)
    .eq("patient_id", patient.id);

  // Audit: patient viewed lab
  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "patient_view_lab",
    resourceType: "lab_report",
    resourceId: id,
    detail: { patient_id: patient.id },
  });

  return NextResponse.json({
    lab: { ...lab, biomarker_results: biomarkers || [] },
  });
}

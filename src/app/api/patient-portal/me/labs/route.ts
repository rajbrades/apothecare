import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me/labs
 * Returns shared lab reports for the current patient.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, practitioner_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!patient) return jsonError("Patient not found", 404);

  const { data: labs, error } = await supabase
    .from("lab_reports")
    .select("id, collection_date, lab_vendor, test_type, test_name, status, created_at")
    .eq("patient_id", patient.id)
    .eq("is_shared_with_patient", true)
    .eq("status", "complete")
    .order("collection_date", { ascending: false });

  if (error) {
    console.error("[Portal Labs] Query error:", error.message);
    return jsonError("Internal server error", 500);
  }

  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "read",
    resourceType: "lab_report",
    detail: { via: "patient_portal", count: labs?.length || 0 },
  });

  return NextResponse.json({ labs: labs || [] });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me/notes
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

  const { data: notes, error } = await supabase
    .from("visits")
    .select("id, visit_date, visit_type, chief_complaint, status, created_at, practitioners(full_name)")
    .eq("patient_id", patient.id)
    .eq("is_shared_with_patient", true)
    .eq("status", "completed")
    .order("visit_date", { ascending: false });

  if (error) {
    console.error("[Portal Notes] Query error:", error.message);
    return jsonError("Internal server error", 500);
  }

  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "read",
    resourceType: "visit",
    detail: { via: "patient_portal", count: notes?.length || 0 },
  });

  return NextResponse.json({ notes: notes || [] });
}

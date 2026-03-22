import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me/notes/[id]
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

  const { data: note } = await supabase
    .from("visits")
    .select(`
      id, visit_date, visit_type, chief_complaint, status,
      soap_subjective, soap_objective, soap_assessment, soap_plan,
      created_at,
      practitioners (full_name, practice_name)
    `)
    .eq("id", id)
    .eq("patient_id", patient.id)
    .eq("is_shared_with_patient", true)
    .single();

  if (!note) return jsonError("Note not found", 404);

  auditLog({
    request,
    practitionerId: patient.practitioner_id,
    action: "patient_view_note",
    resourceType: "visit",
    resourceId: id,
    detail: { patient_id: patient.id },
  });

  return NextResponse.json({ note });
}

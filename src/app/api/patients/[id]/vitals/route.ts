import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/patients/[id]/vitals ────────────────────────────────────────
// Returns vitals and health ratings time series for a patient,
// derived from visits that have at least one of those fields populated.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Verify patient belongs to this practitioner
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!patient) return jsonError("Patient not found", 404);

    // Fetch visits with vitals or health ratings, ordered by visit date
    const { data: rows, error } = await supabase
      .from("visits")
      .select("visit_date, vitals_data, health_ratings")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .or("vitals_data.not.is.null,health_ratings.not.is.null")
      .order("visit_date", { ascending: true });

    if (error) return jsonError("Failed to fetch vitals", 500);

    // Shape the response into parallel vitals/ratings arrays
    const vitals: Array<Record<string, unknown>> = [];
    const ratings: Array<Record<string, unknown>> = [];

    for (const row of rows ?? []) {
      const date = row.visit_date
        ? new Date(row.visit_date).toISOString().split("T")[0]
        : null;
      if (!date) continue;

      if (row.vitals_data && typeof row.vitals_data === "object") {
        vitals.push({ date, ...(row.vitals_data as Record<string, unknown>) });
      }
      if (row.health_ratings && typeof row.health_ratings === "object") {
        ratings.push({ date, ...(row.health_ratings as Record<string, unknown>) });
      }
    }

    return NextResponse.json({ vitals, ratings });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

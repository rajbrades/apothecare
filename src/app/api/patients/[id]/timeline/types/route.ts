import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/patients/[id]/timeline/types — Distinct event types ─────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Verify patient belongs to practitioner
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!patient) return jsonError("Patient not found", 404);

    // Get distinct event types that have at least one event
    const { data, error } = await supabase
      .from("timeline_events")
      .select("event_type")
      .eq("patient_id", patientId);

    if (error) return jsonError("Failed to fetch event types", 500);

    const types = [...new Set((data || []).map((e: { event_type: string }) => e.event_type))];

    return NextResponse.json({ types });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

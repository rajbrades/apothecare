import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import type { FMTimelineEvent, FMTimelineData } from "@/types/database";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── POST /api/patients/[id]/fm-timeline/events ────────────────────────────
// Atomically appends a new event to fm_timeline_data.events.
// Used by practitioners pushing timeline events → FM Timeline, and will be
// reused by the patient portal (source: "patient") once that is built.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

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

    const body = await request.json();
    const { category, life_stage, title, notes, year, source = "practitioner" } = body;

    if (!category || !life_stage || !title?.trim()) {
      return jsonError("category, life_stage, and title are required", 400);
    }

    // Read current fm_timeline_data
    const { data: patient } = await supabase
      .from("patients")
      .select("fm_timeline_data")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!patient) return jsonError("Patient not found", 404);

    const existing = (patient.fm_timeline_data as FMTimelineData | null) ?? { events: [] };

    const newEvent: FMTimelineEvent = {
      id: newId(),
      category,
      life_stage,
      title: title.trim(),
      notes: notes?.trim() || undefined,
      year: year ? Number(year) : undefined,
      source,
    };

    const updatedData: FMTimelineData = {
      events: [...existing.events, newEvent],
    };

    await supabase
      .from("patients")
      .update({ fm_timeline_data: updatedData })
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id);

    return NextResponse.json({ event: newEvent, fm_timeline_data: updatedData });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

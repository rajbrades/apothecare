import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { pushFMEventSchema } from "@/lib/validations/fm-timeline";
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
    const parsed = pushFMEventSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

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
      category: parsed.data.category,
      life_stage: parsed.data.life_stage,
      title: parsed.data.title.trim(),
      notes: parsed.data.notes?.trim() || undefined,
      year: parsed.data.year ?? undefined,
      source: parsed.data.source,
    };

    const updatedData: FMTimelineData = {
      events: [...existing.events, newEvent],
    };

    await supabase
      .from("patients")
      .update({ fm_timeline_data: updatedData })
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "fm_timeline",
      resourceId: patientId,
      detail: { action: "push_event", category: newEvent.category, life_stage: newEvent.life_stage },
    });

    return NextResponse.json({ event: newEvent, fm_timeline_data: updatedData });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

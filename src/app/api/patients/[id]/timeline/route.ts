import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import {
  timelineQuerySchema,
  timelineEventCreateSchema,
} from "@/lib/validations/timeline";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/patients/[id]/timeline — List timeline events ────────────
export async function GET(
  request: NextRequest,
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

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = timelineQuerySchema.safeParse(searchParams);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { cursor, limit, event_types, body_systems } = parsed.data;

    // Build query
    let query = supabase
      .from("timeline_events")
      .select(
        "id, event_type, event_date, source_table, source_id, title, summary, detail, body_systems, biomarker_codes, visible_to_patient, is_pinned, created_at"
      )
      .eq("patient_id", patientId)
      .order("event_date", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    // Cursor: fetch events before the cursor event
    if (cursor) {
      // Get the cursor event's date for comparison
      const { data: cursorEvent } = await supabase
        .from("timeline_events")
        .select("event_date")
        .eq("id", cursor)
        .single();

      if (cursorEvent) {
        query = query.or(
          `event_date.lt.${cursorEvent.event_date},and(event_date.eq.${cursorEvent.event_date},id.lt.${cursor})`
        );
      }
    }

    // Filter by event types
    if (event_types) {
      const types = event_types.split(",").map((t) => t.trim());
      query = query.in("event_type", types);
    }

    // Filter by body systems (overlap)
    if (body_systems) {
      const systems = body_systems.split(",").map((s) => s.trim());
      query = query.overlaps("body_systems", systems);
    }

    const { data: events, error } = await query;
    if (error) return jsonError("Failed to fetch timeline events", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "timeline_event",
      detail: {
        patient_id: patientId,
        count: events?.length || 0,
        filters: { event_types, body_systems },
      },
    });

    const nextCursor =
      events && events.length === limit
        ? events[events.length - 1].id
        : null;

    return NextResponse.json({ events: events || [], nextCursor });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── POST /api/patients/[id]/timeline — Create manual timeline event ───
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

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

    const body = await request.json();
    const parsed = timelineEventCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { data: event, error } = await supabase
      .from("timeline_events")
      .insert({
        patient_id: patientId,
        practitioner_id: practitioner.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (error) return jsonError("Failed to create timeline event", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "timeline_event",
      resourceId: event.id,
      detail: { patient_id: patientId, event_type: parsed.data.event_type },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

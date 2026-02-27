import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/visits/[id]/push-vitals ────────────────────────────────
// Pushes the visit's vitals_data and health_ratings to the patient's
// timeline as a "vitals" event. Idempotent: re-pushing updates the
// existing event rather than creating a duplicate.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: visitId } = await params;
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

    // Fetch visit — verify ownership and patient linkage
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .select(
        "id, patient_id, visit_date, vitals_data, health_ratings, created_at"
      )
      .eq("id", visitId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (visitError || !visit) return jsonError("Visit not found", 404);
    if (!visit.patient_id)
      return jsonError("Visit is not linked to a patient", 400);

    const vitals = visit.vitals_data as Record<string, unknown> | null;
    const ratings = visit.health_ratings as Record<string, unknown> | null;

    if (
      (!vitals || Object.keys(vitals).length === 0) &&
      (!ratings || Object.keys(ratings).length === 0)
    ) {
      return jsonError("No vitals or health ratings to push", 400);
    }

    // Build a human-readable summary
    const parts: string[] = [];
    if (vitals) {
      if (vitals.weight_kg) parts.push(`Weight: ${vitals.weight_kg} kg`);
      if (vitals.bp_systolic && vitals.bp_diastolic)
        parts.push(`BP: ${vitals.bp_systolic}/${vitals.bp_diastolic}`);
      if (vitals.heart_rate_bpm) parts.push(`HR: ${vitals.heart_rate_bpm} bpm`);
    }
    if (ratings) {
      const rated = Object.entries(ratings).filter(
        ([, v]) => v != null && typeof v === "number"
      );
      if (rated.length > 0)
        parts.push(`${rated.length} pillar${rated.length > 1 ? "s" : ""} rated`);
    }

    const title = "Vitals & Health Ratings";
    const summary = parts.length > 0 ? parts.join(" · ") : "Vitals recorded";

    const eventDate = visit.visit_date
      ? new Date(visit.visit_date).toISOString()
      : visit.created_at;

    const detail = { vitals_data: vitals, health_ratings: ratings };

    // Dedup by source
    const { data: existing } = await supabase
      .from("timeline_events")
      .select("id")
      .eq("patient_id", visit.patient_id)
      .eq("source_table", "visits")
      .eq("source_id", visitId)
      .eq("event_type", "vitals")
      .maybeSingle();

    let alreadyExisted = false;

    if (existing) {
      alreadyExisted = true;
      await supabase
        .from("timeline_events")
        .update({ title, summary, detail, event_date: eventDate })
        .eq("id", existing.id);
    } else {
      await supabase.from("timeline_events").insert({
        patient_id: visit.patient_id,
        practitioner_id: practitioner.id,
        event_type: "vitals",
        event_date: eventDate,
        source_table: "visits",
        source_id: visitId,
        title,
        summary,
        detail,
        visible_to_patient: false,
        is_pinned: false,
      });
    }

    // Update vitals_pushed_at on the visit
    await supabase
      .from("visits")
      .update({ vitals_pushed_at: new Date().toISOString() })
      .eq("id", visitId);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "timeline_event",
      resourceId: visitId,
      detail: {
        patient_id: visit.patient_id,
        visit_id: visitId,
        type: "vitals",
        updated: alreadyExisted,
      },
    });

    return NextResponse.json({
      pushed: true,
      already_existed: alreadyExisted,
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

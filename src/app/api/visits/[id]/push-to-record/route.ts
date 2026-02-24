import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/visits/[id]/push-to-record ────────────────────────────────
// Upserts a 'visit' timeline_event for a visit on the linked patient's timeline.
// Idempotent: re-pushing updates the existing event rather than creating a duplicate.
// Returns { pushed: true, already_existed: boolean }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: visitId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
      .select("id, patient_id, visit_date, visit_type, chief_complaint, subjective, objective, assessment, plan, created_at")
      .eq("id", visitId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (visitError || !visit) return jsonError("Visit not found", 404);
    if (!visit.patient_id) return jsonError("Visit is not linked to a patient", 400);

    const title = visit.chief_complaint
      ? `Visit: ${visit.chief_complaint.slice(0, 60)}`
      : "Clinical Visit";

    const summary = [visit.assessment, visit.subjective]
      .filter(Boolean)
      .map((s) => s!.slice(0, 200))
      .find(Boolean) ?? "Visit documented";

    const eventDate = visit.visit_date
      ? new Date(visit.visit_date).toISOString()
      : visit.created_at;

    const detail = {
      visit_type: visit.visit_type,
      chief_complaint: visit.chief_complaint,
      has_soap: !!(visit.subjective || visit.assessment),
    };

    // Check for existing timeline event for this visit (dedup by source)
    const { data: existing } = await supabase
      .from("timeline_events")
      .select("id")
      .eq("patient_id", visit.patient_id)
      .eq("source_table", "visits")
      .eq("source_id", visitId)
      .maybeSingle();

    let alreadyExisted = false;

    if (existing) {
      alreadyExisted = true;
      await supabase
        .from("timeline_events")
        .update({ title, summary, detail, event_date: eventDate })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("timeline_events")
        .insert({
          patient_id: visit.patient_id,
          practitioner_id: practitioner.id,
          event_type: "visit",
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

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "timeline_event",
      resourceId: visitId,
      detail: { patient_id: visit.patient_id, visit_id: visitId, updated: alreadyExisted },
    });

    return NextResponse.json({ pushed: true, already_existed: alreadyExisted });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

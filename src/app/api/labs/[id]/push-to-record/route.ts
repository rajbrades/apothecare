import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/labs/[id]/push-to-record ──────────────────────────────────
// Upserts a timeline_event for this lab report on the linked patient's timeline.
// Idempotent: re-pushing updates the existing event with fresh data.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: reportId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Fetch the lab report — verify ownership, patient linked, and complete
    const { data: report, error: reportError } = await supabase
      .from("lab_reports")
      .select("id, patient_id, test_name, test_type, lab_vendor, collection_date, created_at, status")
      .eq("id", reportId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (reportError || !report) return jsonError("Lab report not found", 404);
    if (!report.patient_id) return jsonError("Lab report is not linked to a patient", 400);
    if (report.status !== "complete") return jsonError("Lab report has not been processed yet", 400);

    // Fetch biomarker results for this lab
    const { data: biomarkers } = await supabase
      .from("biomarker_results")
      .select("biomarker_code, biomarker_name, value, unit, functional_flag, conventional_flag, category")
      .eq("lab_report_id", reportId);

    interface BiomarkerRow {
      biomarker_code: string | null;
      biomarker_name: string | null;
      value: number | null;
      unit: string | null;
      functional_flag: string | null;
      conventional_flag: string | null;
      category: string | null;
    }

    const allBiomarkers: BiomarkerRow[] = biomarkers || [];
    const biomarkerCount = allBiomarkers.length;

    // Collect flagged biomarkers
    const flaggedBiomarkers = allBiomarkers
      .filter((b) => {
        const flag = b.functional_flag || b.conventional_flag;
        return flag && flag !== "optimal" && flag !== "normal";
      })
      .map((b) => ({
        name: b.biomarker_name,
        value: b.value,
        unit: b.unit,
        flag: b.functional_flag || b.conventional_flag,
        category: b.category,
      }));

    const flaggedCount = flaggedBiomarkers.length;
    const biomarkerCodes = allBiomarkers.map((b) => b.biomarker_code).filter(Boolean);
    const bodySystems = [...new Set(allBiomarkers.map((b) => b.category).filter(Boolean))] as string[];

    const title = report.test_name || String(report.test_type).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const summary = `${biomarkerCount} biomarker${biomarkerCount !== 1 ? "s" : ""}${flaggedCount > 0 ? ` · ${flaggedCount} flagged` : ""}`;
    const eventDate = report.collection_date
      ? new Date(report.collection_date).toISOString()
      : report.created_at;

    const detail = {
      test_type: report.test_type,
      lab_vendor: report.lab_vendor,
      biomarker_count: biomarkerCount,
      flagged_count: flaggedCount,
      lab_report_id: reportId,
      flagged_biomarkers: flaggedBiomarkers.slice(0, 20), // cap for JSONB size
    };

    // Check for existing timeline event for this lab (dedup by source)
    const { data: existing } = await supabase
      .from("timeline_events")
      .select("id")
      .eq("patient_id", report.patient_id)
      .eq("source_table", "lab_reports")
      .eq("source_id", reportId)
      .maybeSingle();

    let alreadyExisted = false;

    if (existing) {
      alreadyExisted = true;
      await supabase
        .from("timeline_events")
        .update({ title, summary, detail, body_systems: bodySystems, biomarker_codes: biomarkerCodes, event_date: eventDate })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("timeline_events")
        .insert({
          patient_id: report.patient_id,
          practitioner_id: practitioner.id,
          event_type: "lab_result",
          event_date: eventDate,
          source_table: "lab_reports",
          source_id: reportId,
          title,
          summary,
          detail,
          body_systems: bodySystems,
          biomarker_codes: biomarkerCodes,
          visible_to_patient: false,
          is_pinned: false,
        });
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "timeline_event",
      resourceId: reportId,
      detail: { patient_id: report.patient_id, lab_report_id: reportId, updated: alreadyExisted },
    });

    return NextResponse.json({ pushed: true, already_existed: alreadyExisted });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

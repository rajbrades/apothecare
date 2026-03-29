import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";
import { SYMPTOM_GROUPS, SYMPTOM_LABELS, SYMPTOM_TO_GROUP } from "@/lib/constants/symptoms";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

interface SnapshotRow {
  id: string;
  scores: Record<string, number>;
  recorded_at: string;
  source: string;
  notes: string | null;
}

/**
 * GET /api/patients/[id]/symptom-checkin/timeline
 *
 * Practitioner-facing symptom trend data for a patient.
 * ?mode=overview — all symptoms with 2+ data points
 * ?symptom_key=fatigue — full time series for a single symptom
 */
export async function GET(
  request: NextRequest,
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

    // Verify patient ownership
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!patient) return jsonError("Patient not found", 404);

    const mode = request.nextUrl.searchParams.get("mode");
    const symptomKey = request.nextUrl.searchParams.get("symptom_key");

    // Fetch all snapshots (RLS ensures practitioner ownership)
    const { data: snapshots, error } = await supabase
      .from("symptom_score_snapshots")
      .select("id, scores, recorded_at, source, notes")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: true })
      .limit(200);

    if (error) {
      console.error("[symptom-timeline] Query failed:", error.message);
      return jsonError("Failed to fetch symptom timeline", 500);
    }

    const rows = (snapshots || []) as SnapshotRow[];

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "symptom_checkin",
      resourceId: patientId,
      detail: { mode: mode || "list", snapshot_count: rows.length },
    });

    // Single symptom detail
    if (symptomKey) {
      const dataPoints = rows
        .filter((s) => s.scores[symptomKey] != null)
        .map((s) => ({
          date: s.recorded_at,
          value: s.scores[symptomKey],
          source: s.source,
          notes: s.notes,
        }));

      return NextResponse.json({
        symptom_key: symptomKey,
        label: SYMPTOM_LABELS[symptomKey] || symptomKey,
        group: SYMPTOM_TO_GROUP[symptomKey] || "other",
        data_points: dataPoints,
      });
    }

    // Overview mode
    if (mode === "overview") {
      return NextResponse.json({
        trends: buildTrends(rows),
        last_checkin_at: rows.length > 0 ? rows[rows.length - 1].recorded_at : null,
        total_checkins: rows.length,
      });
    }

    // Default: raw snapshots
    return NextResponse.json({
      snapshots: rows,
      last_checkin_at: rows.length > 0 ? rows[rows.length - 1].recorded_at : null,
    });
  } catch (err) {
    console.error("[symptom-timeline] Unhandled error:", err);
    return jsonError("Internal server error", 500);
  }
}

function buildTrends(snapshots: SnapshotRow[]) {
  const groupMap = new Map<string, { date: string; value: number }[]>();

  for (const snapshot of snapshots) {
    for (const [key, value] of Object.entries(snapshot.scores)) {
      if (value == null || value === 0) continue;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push({ date: snapshot.recorded_at, value });
    }
  }

  const trends = [];
  for (const [key, dataPoints] of groupMap) {
    if (dataPoints.length < 2) continue;
    const latest = dataPoints[dataPoints.length - 1];
    const previous = dataPoints[dataPoints.length - 2];
    const change = latest.value - previous.value;
    const changePct = previous.value !== 0 ? (change / previous.value) * 100 : 0;

    trends.push({
      symptom_key: key,
      symptom_name: SYMPTOM_LABELS[key] || key.replace(/_/g, " "),
      group: SYMPTOM_TO_GROUP[key] || "other",
      group_label: SYMPTOM_GROUPS.find((g) => g.key === SYMPTOM_TO_GROUP[key])?.label || "Other",
      latest_value: latest.value,
      previous_value: previous.value,
      change,
      change_pct: Math.round(changePct * 10) / 10,
      latest_date: latest.date,
      previous_date: previous.date,
      data_points: dataPoints,
    });
  }

  const groupOrder = SYMPTOM_GROUPS.map((g) => g.key);
  trends.sort((a, b) => {
    const gi = groupOrder.indexOf(a.group);
    const gj = groupOrder.indexOf(b.group);
    if (gi !== gj) return (gi === -1 ? 99 : gi) - (gj === -1 ? 99 : gj);
    return b.latest_value - a.latest_value;
  });

  return trends;
}

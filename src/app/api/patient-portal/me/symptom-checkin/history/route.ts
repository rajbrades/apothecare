import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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
 * GET /api/patient-portal/me/symptom-checkin/history
 *
 * Returns symptom trend data for the patient.
 * ?mode=overview — all symptoms with 2+ data points, grouped by body system
 * ?symptom_key=fatigue — full time series for a single symptom
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: patient } = await supabase
      .from("patients")
      .select("id, practitioner_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!patient) return jsonError("Patient not found", 404);

    const mode = request.nextUrl.searchParams.get("mode");
    const symptomKey = request.nextUrl.searchParams.get("symptom_key");

    const service = createServiceClient();

    // Fetch all snapshots for the patient, ordered chronologically
    const { data: snapshots, error } = await service
      .from("symptom_score_snapshots")
      .select("id, scores, recorded_at, source, notes")
      .eq("patient_id", patient.id)
      .order("recorded_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[symptom-history] Query failed:", error.message);
      return jsonError("Failed to fetch history", 500);
    }

    const rows = (snapshots || []) as SnapshotRow[];

    auditLog({
      request,
      practitionerId: patient.practitioner_id,
      action: "read",
      resourceType: "symptom_checkin",
      resourceId: patient.id,
      detail: { via: "patient_portal", mode: mode || "list", snapshot_count: rows.length },
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

    // Overview mode — trends for all symptoms with 2+ data points
    if (mode === "overview") {
      return NextResponse.json({
        trends: buildSymptomTrends(rows),
        last_checkin_at: rows.length > 0 ? rows[rows.length - 1].recorded_at : null,
        total_checkins: rows.length,
      });
    }

    // Default: return raw snapshots
    return NextResponse.json({
      snapshots: rows,
      last_checkin_at: rows.length > 0 ? rows[rows.length - 1].recorded_at : null,
    });
  } catch (err) {
    console.error("[symptom-history] Unhandled error:", err);
    return jsonError("Internal server error", 500);
  }
}

function buildSymptomTrends(snapshots: SnapshotRow[]) {
  // Pivot JSONB scores into per-symptom time series
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

  // Sort: by group, then by latest value descending (worst symptoms first)
  const groupOrder = SYMPTOM_GROUPS.map((g) => g.key);
  trends.sort((a, b) => {
    const gi = groupOrder.indexOf(a.group);
    const gj = groupOrder.indexOf(b.group);
    if (gi !== gj) return (gi === -1 ? 99 : gi) - (gj === -1 ? 99 : gj);
    return b.latest_value - a.latest_value;
  });

  return trends;
}

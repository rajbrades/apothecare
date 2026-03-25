import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { biomarkerTimelineQuerySchema } from "@/lib/validations/biomarker-timeline";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me/biomarkers/timeline
 *
 * Patient-facing biomarker timeline endpoint.
 * Supports mode=overview (trend cards) and biomarker_code (single biomarker detail).
 * Only returns data from shared lab reports.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: patient } = await supabase
      .from("patients")
      .select("id, practitioner_id")
      .eq("auth_user_id", user.id)
      .single();
    if (!patient) return jsonError("Patient not found", 404);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = biomarkerTimelineQuerySchema.safeParse(searchParams);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { biomarker_code, mode } = parsed.data;

    auditLog({
      request,
      practitionerId: patient.practitioner_id,
      action: "read",
      resourceType: "biomarker_timeline",
      resourceId: patient.id,
      detail: biomarker_code ? { biomarker_code } : { mode: mode || "list" },
    });

    // Get shared lab report IDs for this patient
    const service = createServiceClient();
    const { data: sharedLabs } = await service
      .from("lab_reports")
      .select("id")
      .eq("patient_id", patient.id)
      .eq("is_shared_with_patient", true);

    const sharedLabIds = (sharedLabs || []).map((l: { id: string }) => l.id);
    if (sharedLabIds.length === 0) {
      if (mode === "overview") return NextResponse.json({ trends: [] });
      return NextResponse.json({ biomarkers: [] });
    }

    // Mode: overview — all biomarkers with 2+ data points
    if (mode === "overview") {
      const { data: allResults } = await service
        .from("biomarker_results")
        .select(
          "biomarker_code, biomarker_name, category, value, unit, collection_date, functional_low, functional_high, conventional_low, conventional_high, functional_flag, conventional_flag"
        )
        .eq("patient_id", patient.id)
        .in("lab_report_id", sharedLabIds)
        .not("collection_date", "is", null)
        .order("collection_date", { ascending: true });

      if (!allResults || allResults.length === 0) {
        return NextResponse.json({ trends: [] });
      }

      const groupMap = new Map<string, typeof allResults>();
      for (const r of allResults) {
        const arr = groupMap.get(r.biomarker_code) || [];
        arr.push(r);
        groupMap.set(r.biomarker_code, arr);
      }

      const trends = [];
      for (const [code, results] of groupMap) {
        if (results.length < 2) continue;
        const latest = results[results.length - 1];
        const previous = results[results.length - 2];
        const change = latest.value - previous.value;
        const changePct =
          previous.value !== 0 ? (change / previous.value) * 100 : 0;

        trends.push({
          biomarker_code: code,
          biomarker_name: results[0].biomarker_name,
          category: results[0].category || null,
          unit: latest.unit || "",
          latest_value: latest.value,
          previous_value: previous.value,
          change,
          change_pct: Math.round(changePct * 10) / 10,
          latest_date: latest.collection_date,
          previous_date: previous.collection_date,
          latest_flag: latest.functional_flag || latest.conventional_flag,
          functional_low: latest.functional_low,
          functional_high: latest.functional_high,
          conventional_low: latest.conventional_low,
          conventional_high: latest.conventional_high,
          data_points: results.map((r: { collection_date: string; value: number }) => ({
            date: r.collection_date,
            value: r.value,
          })),
        });
      }

      trends.sort((a, b) => {
        const catA = a.category || "zzz";
        const catB = b.category || "zzz";
        if (catA !== catB) return catA.localeCompare(catB);
        return a.biomarker_name.localeCompare(b.biomarker_name);
      });

      return NextResponse.json({ trends });
    }

    // Mode: list — return available biomarkers
    if (!biomarker_code) {
      const { data: biomarkers } = await service
        .from("biomarker_results")
        .select("biomarker_code, biomarker_name, category")
        .eq("patient_id", patient.id)
        .in("lab_report_id", sharedLabIds)
        .not("collection_date", "is", null);

      const biomarkerMap = new Map<
        string,
        {
          biomarker_code: string;
          biomarker_name: string;
          category: string | null;
          data_points: number;
        }
      >();

      for (const b of biomarkers || []) {
        const existing = biomarkerMap.get(b.biomarker_code);
        if (existing) {
          existing.data_points++;
        } else {
          biomarkerMap.set(b.biomarker_code, {
            biomarker_code: b.biomarker_code,
            biomarker_name: b.biomarker_name,
            category: b.category,
            data_points: 1,
          });
        }
      }

      return NextResponse.json({ biomarkers: [...biomarkerMap.values()] });
    }

    // Mode: detail — single biomarker time series
    const { data: results } = await service
      .from("biomarker_results")
      .select(
        "biomarker_name, category, value, unit, collection_date, lab_report_id, conventional_low, conventional_high, conventional_flag, functional_low, functional_high, functional_flag"
      )
      .eq("patient_id", patient.id)
      .eq("biomarker_code", biomarker_code)
      .in("lab_report_id", sharedLabIds)
      .not("collection_date", "is", null)
      .order("collection_date", { ascending: true });

    if (!results || results.length === 0) {
      return NextResponse.json({
        biomarker_code,
        biomarker_name: biomarker_code,
        category: null,
        unit: "",
        functional_low: null,
        functional_high: null,
        conventional_low: null,
        conventional_high: null,
        data_points: [],
      });
    }

    const latest = results[results.length - 1];

    return NextResponse.json({
      biomarker_code,
      biomarker_name: results[0].biomarker_name || biomarker_code,
      category: results[0].category || null,
      unit: latest.unit || "",
      functional_low: latest.functional_low,
      functional_high: latest.functional_high,
      conventional_low: latest.conventional_low,
      conventional_high: latest.conventional_high,
      data_points: results.map((r: any) => ({
        date: r.collection_date,
        value: r.value,
        lab_report_id: r.lab_report_id,
        functional_flag: r.functional_flag,
        conventional_flag: r.conventional_flag,
      })),
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

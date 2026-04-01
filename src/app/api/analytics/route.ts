import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/analytics — Aggregate clinical insights for the practitioner.
 *
 * Returns: condition frequency, biomarker flag distribution, supplement trends,
 * protocol stats, visit volume over time, and lab vendor breakdown.
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return jsonError("Unauthorized", 401);

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id, subscription_tier")
    .eq("auth_user_id", user.id)
    .single();
  if (!practitioner) return jsonError("Practitioner not found", 404);

  const pid = practitioner.id;

  // Run all analytics queries in parallel
  const [
    { data: patients },
    { data: visits },
    { data: biomarkers },
    { data: supplements },
    { data: protocols },
    { data: labReports },
    { count: patientCount },
  ] = await Promise.all([
    // Chief complaints + diagnoses
    supabase
      .from("patients")
      .select("chief_complaints, diagnoses")
      .eq("practitioner_id", pid)
      .eq("is_archived", false),

    // Visits in last 12 months
    supabase
      .from("visits")
      .select("visit_date, visit_type, status")
      .eq("practitioner_id", pid)
      .eq("is_archived", false)
      .gte("visit_date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("visit_date", { ascending: true }),

    // Biomarker flags from last 6 months
    supabase
      .from("biomarker_results")
      .select("biomarker_name, category, functional_flag, collection_date")
      .eq("practitioner_id", pid)
      .gte("collection_date", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),

    // Active supplements
    supabase
      .from("patient_supplements")
      .select("name, status, action")
      .eq("practitioner_id", pid),

    // All protocols
    supabase
      .from("treatment_protocols")
      .select("status, focus_areas, total_duration_weeks, created_at")
      .eq("practitioner_id", pid),

    // Lab reports in last 12 months
    supabase
      .from("lab_reports")
      .select("lab_vendor, test_type, collection_date, status")
      .eq("practitioner_id", pid)
      .eq("is_archived", false)
      .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),

    // Total patient count
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("practitioner_id", pid)
      .eq("is_archived", false),
  ]);

  // ── 1. Top Conditions (chief complaints + diagnoses) ──────────
  const conditionCounts = new Map<string, number>();
  for (const p of patients || []) {
    for (const cc of (p.chief_complaints || []) as string[]) {
      const normalized = cc.trim().toLowerCase();
      if (normalized) conditionCounts.set(normalized, (conditionCounts.get(normalized) || 0) + 1);
    }
    for (const dx of (p.diagnoses || []) as string[]) {
      const normalized = dx.trim().toLowerCase();
      if (normalized) conditionCounts.set(normalized, (conditionCounts.get(normalized) || 0) + 1);
    }
  }
  const topConditions = [...conditionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

  // ── 2. Visit Volume by Month ──────────────────────────────────
  const visitsByMonth = new Map<string, { total: number; soap: number; follow_up: number; consult: number; h_and_p: number }>();
  for (const v of visits || []) {
    const month = v.visit_date?.slice(0, 7); // YYYY-MM
    if (!month) continue;
    if (!visitsByMonth.has(month)) visitsByMonth.set(month, { total: 0, soap: 0, follow_up: 0, consult: 0, h_and_p: 0 });
    const entry = visitsByMonth.get(month)!;
    entry.total++;
    if (v.visit_type === "soap") entry.soap++;
    else if (v.visit_type === "follow_up") entry.follow_up++;
    else if (v.visit_type === "consult") entry.consult++;
    else if (v.visit_type === "history_physical") entry.h_and_p++;
  }
  const visitVolume = [...visitsByMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({ month, ...data }));

  // ── 3. Biomarker Flag Distribution ────────────────────────────
  const flagCounts: Record<string, number> = { optimal: 0, normal: 0, borderline_low: 0, borderline_high: 0, low: 0, high: 0, critical: 0 };
  const flaggedBiomarkers = new Map<string, number>();
  for (const bm of biomarkers || []) {
    const flag = bm.functional_flag;
    if (flag && flag in flagCounts) flagCounts[flag]++;
    if (flag && flag !== "normal" && flag !== "optimal") {
      flaggedBiomarkers.set(bm.biomarker_name, (flaggedBiomarkers.get(bm.biomarker_name) || 0) + 1);
    }
  }
  const topFlaggedBiomarkers = [...flaggedBiomarkers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // ── 4. Biomarker Categories ───────────────────────────────────
  const categoryCounts = new Map<string, number>();
  for (const bm of biomarkers || []) {
    const cat = bm.category || "other";
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }
  const biomarkerCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category: category.charAt(0).toUpperCase() + category.slice(1), count }));

  // ── 5. Supplement Trends ──────────────────────────────────────
  const supplementCounts = new Map<string, number>();
  let activeSupplements = 0;
  let discontinuedSupplements = 0;
  for (const s of supplements || []) {
    if (s.status === "active") {
      activeSupplements++;
      supplementCounts.set(s.name, (supplementCounts.get(s.name) || 0) + 1);
    } else if (s.status === "discontinued") {
      discontinuedSupplements++;
    }
  }
  const topSupplements = [...supplementCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // ── 6. Protocol Stats ─────────────────────────────────────────
  const protocolStats = { draft: 0, active: 0, completed: 0, archived: 0 };
  const focusAreaCounts = new Map<string, number>();
  for (const p of protocols || []) {
    if (p.status in protocolStats) protocolStats[p.status as keyof typeof protocolStats]++;
    for (const fa of (p.focus_areas || []) as string[]) {
      focusAreaCounts.set(fa, (focusAreaCounts.get(fa) || 0) + 1);
    }
  }
  const topFocusAreas = [...focusAreaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([area, count]) => ({ area, count }));

  // ── 7. Lab Vendor Distribution ────────────────────────────────
  const vendorCounts = new Map<string, number>();
  for (const lr of labReports || []) {
    const vendor = lr.lab_vendor || "other";
    vendorCounts.set(vendor, (vendorCounts.get(vendor) || 0) + 1);
  }
  const labVendors = [...vendorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([vendor, count]) => ({ vendor, count }));

  return NextResponse.json({
    summary: {
      total_patients: patientCount ?? 0,
      total_visits: visits?.length ?? 0,
      total_biomarkers: biomarkers?.length ?? 0,
      total_protocols: protocols?.length ?? 0,
      active_supplements: activeSupplements,
    },
    topConditions,
    visitVolume,
    flagDistribution: flagCounts,
    topFlaggedBiomarkers,
    biomarkerCategories,
    topSupplements,
    supplementStats: { active: activeSupplements, discontinued: discontinuedSupplements },
    protocolStats,
    topFocusAreas,
    labVendors,
  });
}

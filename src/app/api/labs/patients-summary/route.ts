import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

interface PatientLabSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  lab_count: number;
  latest_lab_date: string | null;
}

// ── GET /api/labs/patients-summary ─────────────────────────────────────
// Returns all active patients for this practitioner with their lab counts.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    interface PatientRow { id: string; first_name: string | null; last_name: string | null; }
    interface LabRow { patient_id: string | null; created_at: string; }

    // Fetch all active patients
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", false)
      .order("last_name", { ascending: true });

    if (patientsError) return jsonError("Failed to fetch patients", 500);

    // Fetch all non-archived lab reports (minimal fields) for aggregation
    const { data: labs, error: labsError } = await supabase
      .from("lab_reports")
      .select("patient_id, created_at")
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", false);

    if (labsError) return jsonError("Failed to fetch labs", 500);

    // Count unlinked labs (no patient_id)
    const unlinkedCount = (labs as LabRow[] || []).filter((l: LabRow) => !l.patient_id).length;

    // Build per-patient counts and latest dates
    const countMap = new Map<string, { count: number; latest: string | null }>();
    for (const lab of (labs as LabRow[] || [])) {
      if (!lab.patient_id) continue;
      const entry = countMap.get(lab.patient_id) ?? { count: 0, latest: null };
      entry.count++;
      if (!entry.latest || lab.created_at > entry.latest) {
        entry.latest = lab.created_at;
      }
      countMap.set(lab.patient_id, entry);
    }

    const summaries: PatientLabSummary[] = (patients as PatientRow[] || [])
      .map((p: PatientRow) => {
        const entry = countMap.get(p.id);
        return {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          lab_count: entry?.count ?? 0,
          latest_lab_date: entry?.latest ?? null,
        };
      })
      .sort((a: PatientLabSummary, b: PatientLabSummary) => {
        // Sort by lab count desc, then last_name asc
        if (b.lab_count !== a.lab_count) return b.lab_count - a.lab_count;
        return (a.last_name ?? "").localeCompare(b.last_name ?? "");
      });

    return NextResponse.json({ patients: summaries, unlinked_count: unlinkedCount });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

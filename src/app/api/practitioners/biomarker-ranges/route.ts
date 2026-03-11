import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { updateBiomarkerRangesSchema } from "@/lib/validations/biomarker-ranges";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/practitioners/biomarker-ranges — Get all custom overrides ──
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

    const { data: ranges, error } = await supabase
      .from("practitioner_biomarker_ranges")
      .select("id, biomarker_code, biomarker_name, functional_low, functional_high, updated_at")
      .eq("practitioner_id", practitioner.id);

    if (error) return jsonError("Failed to fetch biomarker ranges", 500);

    return NextResponse.json({ ranges: ranges || [] });
  } catch (error) {
    console.error("GET biomarker ranges error:", error);
    return jsonError("Internal server error", 500);
  }
}

// ── PUT /api/practitioners/biomarker-ranges — Bulk update custom overrides ──
export async function PUT(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

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
    const parsed = updateBiomarkerRangesSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const incomingRanges = parsed.data;

    // We'll replace the existing ranges with the new set completely.
    // So we first delete the ones that are NOT in the incoming set.
    const incomingCodes = incomingRanges.map((r) => r.biomarker_code);
    
    // 1. Delete removed ones
    if (incomingCodes.length > 0) {
      await supabase
        .from("practitioner_biomarker_ranges")
        .delete()
        .eq("practitioner_id", practitioner.id)
        .not("biomarker_code", "in", `(${incomingCodes.map(c => `"${c}"`).join(',')})`);
    } else {
        // If empty array passed, they deleted all overrides
        await supabase
          .from("practitioner_biomarker_ranges")
          .delete()
          .eq("practitioner_id", practitioner.id);
    }

    // 2. Upsert the passed in ranges
    if (incomingRanges.length > 0) {
      const upserts = incomingRanges.map((item) => ({
        practitioner_id: practitioner.id,
        biomarker_code: item.biomarker_code,
        biomarker_name: item.biomarker_name,
        functional_low: item.functional_low,
        functional_high: item.functional_high,
      }));

      const { error: upsertError } = await supabase
        .from("practitioner_biomarker_ranges")
        .upsert(upserts, { onConflict: "practitioner_id, biomarker_code" });

      if (upsertError) {
        console.error("Biomarker upsert error:", upsertError);
        return jsonError("Failed to update biomarker ranges", 500);
      }
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "practitioner",
      resourceId: practitioner.id,
      detail: { overridden_biomarkers_count: incomingRanges.length },
    });

    return NextResponse.json({ success: true, count: incomingRanges.length });
  } catch (error) {
    console.error("PUT biomarker ranges error:", error);
    return jsonError("Internal server error", 500);
  }
}

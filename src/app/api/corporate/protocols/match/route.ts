import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { protocolMatchSchema } from "@/lib/validations/corporate-protocol";
import { matchProtocols } from "@/lib/protocols/corporate-matcher";
import type { PatientMatchParameters } from "@/types/corporate-protocol";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/corporate/protocols/match
 * Match patient parameters against corporate protocol decision rules.
 * Optionally auto-pulls lab values from patient chart if patient_id provided.
 */
export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();

    if (!practitioner) return jsonError("Practitioner not found", 404);

    const body = await request.json();
    const parsed = protocolMatchSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    // Build patient parameters — auto-pull labs if patient_id provided
    const params: PatientMatchParameters = { ...parsed.data };

    if (parsed.data.patient_id) {
      // Verify patient ownership
      const { data: patient } = await supabase
        .from("patients")
        .select("id, date_of_birth, sex")
        .eq("id", parsed.data.patient_id)
        .eq("practitioner_id", practitioner.id)
        .single();

      if (patient) {
        // Auto-fill sex and age from patient chart
        if (patient.sex && !params.sex) {
          params.sex = patient.sex as "male" | "female";
        }
        if (patient.date_of_birth && !params.age) {
          const dob = new Date(patient.date_of_birth);
          params.age = Math.floor(
            (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          );
        }

        // Pull latest biomarker results (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: biomarkers } = await supabase
          .from("biomarker_results")
          .select("biomarker_code, value, collection_date")
          .eq("patient_id", parsed.data.patient_id)
          .gte("collection_date", sixMonthsAgo.toISOString())
          .order("collection_date", { ascending: false });

        if (biomarkers && biomarkers.length > 0) {
          // Map biomarker codes to match parameters (take most recent value)
          const labMap: Record<string, string> = {
            TOTAL_T: "total_testosterone",
            FREE_T: "free_testosterone",
            FSH: "fsh",
            LH: "lh",
            IGF1: "igf1",
            ESTRADIOL: "estradiol",
            HCT: "hematocrit",
            PSA: "psa",
          };

          const seen = new Set<string>();
          for (const b of biomarkers as { biomarker_code: string; value: number }[]) {
            const paramKey = labMap[b.biomarker_code];
            if (paramKey && !seen.has(paramKey) && params[paramKey] === undefined) {
              (params as Record<string, unknown>)[paramKey] = b.value;
              seen.add(paramKey);
            }
          }
        }
      }
    }

    // Get provider's corporate membership(s)
    const { data: memberships } = await supabase
      .from("corporate_provider_memberships")
      .select("corporate_id")
      .eq("practitioner_id", practitioner.id)
      .eq("is_active", true);

    const corporateIds = (memberships || []).map((m: { corporate_id: string }) => m.corporate_id);

    if (corporateIds.length === 0) {
      return NextResponse.json({ matches: [], params_used: params });
    }

    // Fetch all active protocols with their decision rules
    const { data: protocols } = await supabase
      .from("corporate_protocols")
      .select("*, protocol_decision_rules(*)")
      .in("corporate_id", corporateIds)
      .eq("status", "active");

    if (!protocols || protocols.length === 0) {
      return NextResponse.json({ matches: [], params_used: params });
    }

    // Run matching engine
    const matches = matchProtocols(
      protocols as (typeof protocols[0] & { decision_rules: typeof protocols[0]["protocol_decision_rules"] })[],
      params
    );

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "query",
      resourceType: "corporate_protocol_match",
      detail: {
        params_used: params,
        match_count: matches.length,
        top_match: matches[0]?.protocol.title ?? null,
        top_score: matches[0]?.score ?? 0,
      },
    });

    return NextResponse.json({
      matches,
      params_used: params,
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

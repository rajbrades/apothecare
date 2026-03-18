import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { classifyEvidenceLevel } from "@/lib/chat/classify-evidence";
import { z } from "zod";

/** Evidence hierarchy — lower index = stronger evidence */
const EVIDENCE_RANK: Record<string, number> = {
  "meta-analysis": 0,
  meta_analysis: 0,
  rct: 1,
  guideline: 2,
  clinical_guideline: 2,
  cohort: 3,
  cohort_study: 3,
  "case-study": 4,
  case_study: 4,
  expert_consensus: 5,
  in_vitro: 6,
  other: 7,
};

const verifySchema = z.object({
  doi: z.string().min(1),
  title: z.string().min(1),
  authors: z.array(z.string()).optional().default([]),
  year: z.number().optional(),
  source: z.string().optional(),
  level: z.string().optional(),
  summary: z.string().optional(),
  context_type: z.enum(["chat", "supplement", "lab", "general"]).default("general"),
  context_value: z.string().optional(),
  origin: z.string().optional().default("manual"),
});

const flagSchema = z.object({
  doi: z.string().min(1),
  reason: z.string().min(1).max(500),
  context_type: z.enum(["chat", "supplement", "lab", "general"]).default("general"),
  context_value: z.string().optional(),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/citations/verify — Verify a citation or flag it as incorrect.
 *
 * Body: { doi, title, authors?, year?, source?, level?, summary?,
 *         context_type?, context_value?, origin? }
 * OR for flagging: { doi, reason, context_type?, context_value?, _action: "flag" }
 */
export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

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

    const body = await request.json();

    // Handle flag action
    if (body._action === "flag") {
      const parsed = flagSchema.safeParse(body);
      if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

      const serviceClient = createServiceClient();
      const { error: flagError } = await serviceClient
        .from("verified_citations")
        .upsert(
          {
            doi: parsed.data.doi,
            title: "Flagged",
            verified_by: practitioner.id,
            context_type: parsed.data.context_type,
            context_value: parsed.data.context_value || null,
            is_flagged: true,
            flagged_reason: parsed.data.reason,
          },
          { onConflict: "doi, verified_by, context_type, context_value" }
        );

      if (flagError) {
        console.error("[Flag Citation] DB Error:", flagError);
        return jsonError("Failed to flag citation", 500);
      }

      auditLog({
        request,
        practitionerId: practitioner.id,
        action: "update",
        resourceType: "citation_flag",
        detail: { doi: parsed.data.doi, context_type: parsed.data.context_type },
      });

      return NextResponse.json({ success: true, action: "flagged" });
    }

    // Handle verify action
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const level = parsed.data.level || classifyEvidenceLevel(parsed.data.title);
    const rank = EVIDENCE_RANK[level] ?? 7;

    const serviceClient = createServiceClient();
    const { error: insertError } = await serviceClient
      .from("verified_citations")
      .upsert(
        {
          doi: parsed.data.doi,
          title: parsed.data.title,
          authors: parsed.data.authors,
          year: parsed.data.year || null,
          journal: parsed.data.source || null,
          evidence_level: level,
          evidence_rank: rank,
          abstract_snippet: parsed.data.summary || null,
          verified_by: practitioner.id,
          context_type: parsed.data.context_type,
          context_value: parsed.data.context_value || null,
          origin: parsed.data.origin,
          is_flagged: false,
          flagged_reason: null,
        },
        { onConflict: "doi, verified_by, context_type, context_value" }
      );

    if (insertError) {
      console.error("[Verify Citation] DB Error:", insertError);
      return jsonError("Failed to save verification", 500);
    }

    // Also backfill to supplement_evidence if context is supplement (backward compat)
    if (parsed.data.context_type === "supplement" && parsed.data.context_value) {
      await serviceClient
        .from("supplement_evidence")
        .upsert(
          {
            supplement_name: parsed.data.context_value,
            doi: parsed.data.doi,
            title: parsed.data.title,
            authors: parsed.data.authors,
            year: parsed.data.year || null,
            journal: parsed.data.source || null,
            evidence_level: level,
            evidence_rank: rank,
            abstract_snippet: parsed.data.summary || null,
            is_verified: true,
          },
          { onConflict: "supplement_name, doi" }
        )
        .then(() => {}) // non-fatal
        .catch(() => {}); // non-fatal
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "citation_verification",
      detail: {
        doi: parsed.data.doi,
        context_type: parsed.data.context_type,
        context_value: parsed.data.context_value,
      },
    });

    return NextResponse.json({ success: true, action: "verified" });
  } catch (err) {
    console.error("[Citation Verify] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { env } from "@/lib/env";
import { z } from "zod";

/** Minimum number of unique flags on a DOI to auto-exclude it */
const AUTO_EXCLUDE_THRESHOLD = 3;

interface FlaggedRow {
  id: string;
  doi: string;
  title: string;
  authors: string[] | null;
  year: number | null;
  journal: string | null;
  evidence_level: string | null;
  flagged_reason: string | null;
  context_type: string;
  context_value: string | null;
  verified_by: string;
  verified_at: string;
  is_flagged: boolean;
  conversation_id: string | null;
  message_id: string | null;
  flag_count: number;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isAdmin(email: string): boolean {
  const adminEmails = (env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

async function requireAdminUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email || !isAdmin(user.email)) return null;
  return user;
}

/**
 * GET /api/admin/flagged-citations — List flagged citations with context.
 *
 * Excludes auto-resolved flags (DOIs with >= 3 total flags are auto-excluded
 * and a citation_correction is created automatically).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await requireAdminUser(supabase);
    if (!user) return jsonError("Forbidden", 403);

    const serviceClient = createServiceClient();

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const includeAutoExcluded = searchParams.get("include_auto") === "true";

    let query = serviceClient
      .from("verified_citations")
      .select(
        "id, doi, title, authors, year, journal, evidence_level, flagged_reason, context_type, context_value, verified_by, verified_at, is_flagged, conversation_id, message_id, flag_count"
      )
      .eq("is_flagged", true)
      .order("verified_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("verified_at", cursor);
    }

    const { data, error } = await query as { data: FlaggedRow[] | null; error: unknown };
    if (error) {
      console.error("[Admin Flagged Citations] DB Error:", error);
      return jsonError("Failed to fetch flagged citations", 500);
    }

    const rows = data || [];

    // Count total flags per DOI (across all practitioners)
    const uniqueDois = [...new Set(rows.map((r) => r.doi))];
    const doiFlagCounts: Record<string, number> = {};
    for (const doi of uniqueDois) {
      const { count } = await serviceClient
        .from("verified_citations")
        .select("id", { count: "exact", head: true })
        .eq("doi", doi)
        .eq("is_flagged", true);
      doiFlagCounts[doi] = count || 0;
    }

    // Filter out auto-excluded unless requested
    const filtered = includeAutoExcluded
      ? rows
      : rows.filter((r) => (doiFlagCounts[r.doi] || 0) < AUTO_EXCLUDE_THRESHOLD);

    // Fetch practitioner names
    const practitionerIds = [...new Set(filtered.map((d) => d.verified_by).filter(Boolean))];
    let practitionerMap: Record<string, string> = {};
    if (practitionerIds.length > 0) {
      const { data: practitioners } = await serviceClient
        .from("practitioners")
        .select("id, first_name, last_name")
        .in("id", practitionerIds);
      if (practitioners) {
        practitionerMap = Object.fromEntries(
          practitioners.map((p: { id: string; first_name: string | null; last_name: string | null }) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim()])
        );
      }
    }

    // For rows with conversation_id, fetch the Q&A context (user question + AI answer)
    const conversationIds = [...new Set(filtered.map((r) => r.conversation_id).filter(Boolean))] as string[];
    const qaContextMap: Record<string, { question: string; answer: string }> = {};
    for (const convId of conversationIds) {
      // Get the message that was flagged and the preceding user message
      const flaggedRow = filtered.find((r) => r.conversation_id === convId);
      if (!flaggedRow?.message_id) {
        // No specific message — get the last 2 messages from the conversation
        const { data: msgs } = await serviceClient
          .from("messages")
          .select("role, content")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: false })
          .limit(2);
        if (msgs && msgs.length >= 2) {
          const userMsg = msgs.find((m: { role: string }) => m.role === "user");
          const assistantMsg = msgs.find((m: { role: string }) => m.role === "assistant");
          if (userMsg && assistantMsg) {
            qaContextMap[convId] = {
              question: (userMsg as { content: string }).content.slice(0, 500),
              answer: (assistantMsg as { content: string }).content.slice(0, 1000),
            };
          }
        }
        continue;
      }

      // Get the specific flagged message and its preceding user message
      const { data: flaggedMsg } = await serviceClient
        .from("messages")
        .select("role, content, created_at")
        .eq("id", flaggedRow.message_id)
        .single();

      if (flaggedMsg) {
        const { data: prevMsgs } = await serviceClient
          .from("messages")
          .select("role, content")
          .eq("conversation_id", convId)
          .eq("role", "user")
          .lt("created_at", (flaggedMsg as { created_at: string }).created_at)
          .order("created_at", { ascending: false })
          .limit(1);

        qaContextMap[convId] = {
          question: prevMsgs?.[0] ? (prevMsgs[0] as { content: string }).content.slice(0, 500) : "(No question found)",
          answer: (flaggedMsg as { content: string }).content.slice(0, 1000),
        };
      }
    }

    // Check which DOIs already have corrections
    const { data: corrections } = await serviceClient
      .from("citation_corrections")
      .select("flagged_doi")
      .in("flagged_doi", uniqueDois.length > 0 ? uniqueDois : ["__none__"]);
    const correctedDois = new Set((corrections || []).map((c: { flagged_doi: string }) => c.flagged_doi));

    const enriched = filtered.map((row) => ({
      ...row,
      flagged_by_name: practitionerMap[row.verified_by] || "Unknown",
      total_flags: doiFlagCounts[row.doi] || 0,
      auto_excluded: (doiFlagCounts[row.doi] || 0) >= AUTO_EXCLUDE_THRESHOLD,
      has_correction: correctedDois.has(row.doi),
      qa_context: row.conversation_id ? qaContextMap[row.conversation_id] || null : null,
    }));

    const nextCursor = filtered.length === limit ? filtered[filtered.length - 1].verified_at : null;

    return NextResponse.json({ data: enriched, nextCursor });
  } catch (err) {
    console.error("[Admin Flagged Citations] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

const resolveSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["dismiss", "remove", "replace"]),
  // Required when action is "replace"
  replacement_doi: z.string().optional(),
  replacement_title: z.string().optional(),
  replacement_authors: z.array(z.string()).optional(),
  replacement_year: z.number().optional(),
  replacement_journal: z.string().optional(),
  replacement_evidence_level: z.string().optional(),
  correction_reason: z.string().max(500).optional(),
});

/**
 * POST /api/admin/flagged-citations — Resolve a flagged citation.
 *
 * action: "dismiss" — unflag and keep the citation
 * action: "remove" — delete the citation record entirely
 * action: "replace" — remove the flagged citation and create a correction mapping
 */
export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();
    const user = await requireAdminUser(supabase);
    if (!user) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const serviceClient = createServiceClient();

    // Look up the flagged citation to get its DOI
    const { data: flaggedCitation } = await serviceClient
      .from("verified_citations")
      .select("doi")
      .eq("id", parsed.data.id)
      .single();

    if (!flaggedCitation) return jsonError("Flagged citation not found", 404);
    const flaggedDoi = (flaggedCitation as { doi: string }).doi;

    if (parsed.data.action === "dismiss") {
      // Unflag — restore the citation
      const { error } = await serviceClient
        .from("verified_citations")
        .update({ is_flagged: false, flagged_reason: null, flag_count: 0 })
        .eq("id", parsed.data.id);
      if (error) return jsonError("Failed to dismiss flag", 500);

    } else if (parsed.data.action === "remove") {
      // Delete the flagged citation entirely
      const { error } = await serviceClient
        .from("verified_citations")
        .delete()
        .eq("id", parsed.data.id);
      if (error) return jsonError("Failed to remove citation", 500);

    } else if (parsed.data.action === "replace") {
      // Replace — store correction mapping for future citation resolution
      if (!parsed.data.replacement_doi || !parsed.data.replacement_title) {
        return jsonError("replacement_doi and replacement_title are required for replace action", 400);
      }

      // Get practitioner ID for the admin
      const { data: adminPractitioner } = await serviceClient
        .from("practitioners")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!adminPractitioner) return jsonError("Admin practitioner not found", 404);

      // Evidence rank lookup
      const EVIDENCE_RANK: Record<string, number> = {
        "meta-analysis": 0, meta_analysis: 0, rct: 1, guideline: 2,
        clinical_guideline: 2, cohort: 3, cohort_study: 3,
        "case-study": 4, case_study: 4, expert_consensus: 5, in_vitro: 6, other: 7,
      };

      const { error: correctionError } = await serviceClient
        .from("citation_corrections")
        .upsert(
          {
            flagged_doi: flaggedDoi,
            replacement_doi: parsed.data.replacement_doi,
            replacement_title: parsed.data.replacement_title,
            replacement_authors: parsed.data.replacement_authors || [],
            replacement_year: parsed.data.replacement_year || null,
            replacement_journal: parsed.data.replacement_journal || null,
            replacement_evidence_level: parsed.data.replacement_evidence_level || null,
            replacement_evidence_rank: EVIDENCE_RANK[parsed.data.replacement_evidence_level || ""] ?? 7,
            corrected_by: (adminPractitioner as { id: string }).id,
            correction_reason: parsed.data.correction_reason || null,
            is_auto: false,
          },
          { onConflict: "flagged_doi" }
        );

      if (correctionError) {
        console.error("[Admin Flagged Citations] Correction Error:", correctionError);
        return jsonError("Failed to save correction", 500);
      }

      // Remove the flagged citation
      await serviceClient
        .from("verified_citations")
        .delete()
        .eq("id", parsed.data.id);
    }

    auditLog({
      request,
      practitionerId: user.id,
      action: "update",
      resourceType: "flagged_citation",
      resourceId: parsed.data.id,
      detail: {
        resolution: parsed.data.action,
        flagged_doi: flaggedDoi,
        replacement_doi: parsed.data.replacement_doi,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Flagged Citations] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

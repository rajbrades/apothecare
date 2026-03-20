import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

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

/**
 * GET /api/admin/citations/stats — Citation verification statistics.
 * Returns total verified, flagged, breakdown by context_type,
 * and top verifiers. Admin-only.
 */
export async function GET(request: NextRequest) {
  void request;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) return jsonError("Unauthorized", 401);
    if (!isAdmin(user.email)) return jsonError("Forbidden", 403);

    const serviceClient = createServiceClient();

    const [
      { count: totalVerified },
      { count: totalFlagged },
      { data: byContextRaw },
      { data: recentRaw },
      { data: topVerifiersRaw },
    ] = await Promise.all([
      serviceClient
        .from("verified_citations")
        .select("*", { count: "exact", head: true })
        .eq("is_flagged", false),
      serviceClient
        .from("verified_citations")
        .select("*", { count: "exact", head: true })
        .eq("is_flagged", true),
      serviceClient
        .from("verified_citations")
        .select("context_type")
        .eq("is_flagged", false),
      serviceClient
        .from("verified_citations")
        .select("doi, title, context_type, verified_at, evidence_level, practitioners(full_name)")
        .eq("is_flagged", false)
        .order("verified_at", { ascending: false })
        .limit(10),
      serviceClient
        .from("verified_citations")
        .select("verified_by, practitioners(full_name)")
        .eq("is_flagged", false),
    ]);

    // Count by context_type
    const byContext: Record<string, number> = {};
    for (const row of byContextRaw || []) {
      const t = row.context_type as string;
      byContext[t] = (byContext[t] || 0) + 1;
    }

    // Count by practitioner
    const verifierCounts: Record<string, { name: string; count: number }> = {};
    for (const row of topVerifiersRaw || []) {
      const id = row.verified_by as string;
      const name = (row.practitioners as { full_name?: string } | null)?.full_name || id;
      if (!verifierCounts[id]) verifierCounts[id] = { name, count: 0 };
      verifierCounts[id].count++;
    }
    const topVerifiers = Object.values(verifierCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      total_verified: totalVerified ?? 0,
      total_flagged: totalFlagged ?? 0,
      by_context: byContext,
      top_verifiers: topVerifiers,
      recent: (recentRaw || []).map((r: { doi: string; title: string; context_type: string; evidence_level: string; verified_at: string; practitioners: unknown }) => ({
        doi: r.doi,
        title: r.title,
        context_type: r.context_type,
        evidence_level: r.evidence_level,
        verified_at: r.verified_at,
        practitioner: (r.practitioners as { full_name?: string } | null)?.full_name,
      })),
    });
  } catch (err) {
    console.error("[Admin Citations Stats]", err);
    return jsonError("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/citations/verified — Query verified citations.
 *
 * Query params:
 *   - context_type: filter by context (chat, supplement, lab, general)
 *   - q: search title/journal (ilike)
 *   - doi: exact DOI lookup
 *   - limit: max results (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const contextType = url.searchParams.get("context_type");
    const query = url.searchParams.get("q");
    const doi = url.searchParams.get("doi");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

    let dbQuery = supabase
      .from("verified_citations")
      .select("id, doi, title, authors, year, journal, evidence_level, evidence_rank, context_type, context_value, origin, verified_by, verified_at, created_at")
      .eq("is_flagged", false)
      .order("evidence_rank", { ascending: true })
      .order("verified_at", { ascending: false })
      .limit(limit);

    if (contextType) {
      dbQuery = dbQuery.eq("context_type", contextType);
    }

    if (doi) {
      dbQuery = dbQuery.eq("doi", doi);
    }

    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,journal.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error("[Verified Citations] Query Error:", error);
      return NextResponse.json({ error: "Failed to query citations" }, { status: 500 });
    }

    return NextResponse.json({ citations: data || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";
import { env } from "@/lib/env";
import { classifyEvidenceLevel } from "@/lib/chat/classify-evidence";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isAdmin(email: string): boolean {
  const adminEmails = (env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) {
    console.warn("[Admin] ADMIN_EMAILS env var is not configured — all admin access denied");
  }
  return adminEmails.includes(email.toLowerCase());
}

interface CrossRefItem {
  DOI: string;
  title?: string[];
  author?: { given?: string; family?: string }[];
  published?: { "date-parts"?: number[][] };
  "published-print"?: { "date-parts"?: number[][] };
  "container-title"?: string[];
}

/**
 * GET /api/admin/flagged-citations/search — Search CrossRef for replacement citations.
 *
 * Query params:
 *   q: search query (required)
 *   limit: max results (default 5, max 10)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user?.email || !isAdmin(user.email)) {
      return jsonError("Forbidden", 403);
    }

    // HIPAA §164.312(b): Log admin citation search access
    auditLog({
      request,
      practitionerId: user.id,
      action: "read",
      resourceType: "citation_search",
      detail: { endpoint: "GET /api/admin/flagged-citations/search" },
    });

    const q = request.nextUrl.searchParams.get("q");
    if (!q || q.length < 3) return jsonError("Query too short (min 3 chars)", 400);

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 5, 10);

    const params = new URLSearchParams({
      "query.bibliographic": q,
      rows: String(limit),
      select: "DOI,title,author,published,published-print,container-title",
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://api.crossref.org/works?${params}`, {
      headers: {
        "User-Agent": "Apothecare/1.0 (mailto:support@apothecare.ai)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return jsonError("CrossRef search failed", 502);

    const data = await res.json();
    const items: CrossRefItem[] = data.message?.items || [];

    const results = items.map((item) => {
      const title = item.title?.[0] || "";
      const authors = (item.author || []).map(
        (a) => `${a.family || ""}${a.given ? ` ${a.given.charAt(0)}` : ""}`.trim()
      );
      const dateParts = item.published?.["date-parts"]?.[0] || item["published-print"]?.["date-parts"]?.[0];
      const year = dateParts?.[0] || null;
      const journal = item["container-title"]?.[0] || null;

      return {
        doi: item.DOI,
        title,
        authors,
        year,
        journal,
        evidence_level: classifyEvidenceLevel(title),
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[Admin Citation Search] Error:", err);
    return jsonError("Search failed", 500);
  }
}

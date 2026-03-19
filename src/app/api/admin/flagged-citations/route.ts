import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { env } from "@/lib/env";
import { z } from "zod";

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
 * GET /api/admin/flagged-citations — List all flagged citations.
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

    let query = serviceClient
      .from("verified_citations")
      .select(
        "id, doi, title, authors, year, journal, evidence_level, flagged_reason, context_type, context_value, verified_by, verified_at, is_flagged"
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

    // Fetch practitioner names for flagged_by display
    const practitionerIds = [...new Set(rows.map((d) => d.verified_by).filter(Boolean))];
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

    const enriched = rows.map((row) => ({
      ...row,
      flagged_by_name: practitionerMap[row.verified_by] || "Unknown",
    }));

    const nextCursor = rows.length === limit ? rows[rows.length - 1].verified_at : null;

    return NextResponse.json({ data: enriched, nextCursor });
  } catch (err) {
    console.error("[Admin Flagged Citations] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

const resolveSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["dismiss", "remove"]),
});

/**
 * POST /api/admin/flagged-citations — Resolve a flagged citation.
 *
 * action: "dismiss" — unflag and keep the citation
 * action: "remove" — delete the citation record entirely
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

    if (parsed.data.action === "dismiss") {
      const { error } = await serviceClient
        .from("verified_citations")
        .update({ is_flagged: false, flagged_reason: null })
        .eq("id", parsed.data.id);
      if (error) return jsonError("Failed to dismiss flag", 500);
    } else {
      const { error } = await serviceClient
        .from("verified_citations")
        .delete()
        .eq("id", parsed.data.id);
      if (error) return jsonError("Failed to remove citation", 500);
    }

    auditLog({
      request,
      practitionerId: user.id,
      action: "update",
      resourceType: "flagged_citation",
      resourceId: parsed.data.id,
      detail: { resolution: parsed.data.action },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Flagged Citations] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

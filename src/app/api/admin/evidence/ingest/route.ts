import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { ingestFromPubMedQuery } from "@/lib/evidence/ingest-pubmed";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — ingestion can be slow

const ingestSchema = z.object({
  query: z.string().min(3).max(500),
  maxResults: z.number().int().min(1).max(200).default(50),
  source: z.string().max(50).default("pubmed"),
});

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

export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return jsonError("Unauthorized", 401);
    }

    if (!isAdmin(user.email)) {
      return jsonError("Admin access required", 403);
    }

    const body = await request.json();
    const parsed = ingestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const { query, maxResults, source } = parsed.data;

    const result = await ingestFromPubMedQuery(query, maxResults, source);

    auditLog({
      request,
      practitionerId: user.id,
      action: "create",
      resourceType: "evidence",
      detail: {
        query,
        maxResults,
        source,
        ingested: result.ingested,
        skipped: result.skipped,
        errors: result.errors.length,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Evidence Ingest] Error:", error);
    return jsonError("Internal server error", 500);
  }
}

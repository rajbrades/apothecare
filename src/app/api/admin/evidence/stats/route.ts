import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { auditLog } from "@/lib/api/audit";

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

export async function GET(request: NextRequest) {
  try {
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

    const serviceClient = createServiceClient();

    // Count documents by source
    const { data: docs } = await serviceClient
      .from("evidence_documents")
      .select("source");

    const bySource: Record<string, number> = {};
    let totalDocs = 0;
    for (const doc of docs ?? []) {
      bySource[doc.source] = (bySource[doc.source] || 0) + 1;
      totalDocs++;
    }

    // Count chunks
    const { count: totalChunks } = await serviceClient
      .from("evidence_chunks")
      .select("id", { count: "exact", head: true });

    // Latest ingestion
    const { data: latest } = await serviceClient
      .from("evidence_documents")
      .select("ingested_at")
      .order("ingested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    auditLog({
      request,
      practitionerId: user.id,
      action: "read",
      resourceType: "evidence",
      detail: { operation: "stats" },
    });

    return NextResponse.json({
      totalDocuments: totalDocs,
      totalChunks: totalChunks ?? 0,
      bySource,
      latestIngestion: latest?.ingested_at ?? null,
    });
  } catch (error) {
    console.error("[Evidence Stats] Error:", error);
    return jsonError("Internal server error", 500);
  }
}

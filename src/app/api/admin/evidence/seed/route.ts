import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { runSeedIngestion } from "@/lib/evidence/seed-evidence";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — seed runs many queries

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

    const result = await runSeedIngestion();

    auditLog({
      request,
      practitionerId: user.id,
      action: "create",
      resourceType: "evidence",
      detail: {
        operation: "seed",
        totalIngested: result.totalIngested,
        totalSkipped: result.totalSkipped,
        totalErrors: result.totalErrors,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Evidence Seed] Error:", error);
    return jsonError("Internal server error", 500);
  }
}

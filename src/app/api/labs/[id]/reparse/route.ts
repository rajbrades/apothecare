import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseLabReport } from "@/lib/ai/lab-parsing";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — Claude Vision PDF parsing can be slow

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/labs/[id]/reparse — Re-trigger lab report parsing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: reportId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const rateLimitError = await checkRateLimit(
      supabase, practitioner.id, practitioner.subscription_tier, "lab_upload"
    );
    if (rateLimitError) return rateLimitError;

    const { data: report } = await supabase
      .from("lab_reports")
      .select("id, raw_file_url, patient_id, status")
      .eq("id", reportId)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!report) return jsonError("Lab report not found", 404);
    if (report.status === "parsing") {
      return jsonError("Parsing already in progress", 409);
    }

    // Schedule parsing after response is sent — `after()` keeps the Lambda alive.
    after(async () => {
      try {
        await parseLabReport(report.id, report.raw_file_url, practitioner.id, report.patient_id);
      } catch (err) {
        console.error("Lab re-parse failed:", err);
        const { createServiceClient } = await import("@/lib/supabase/server");
        const svc = createServiceClient();
        await svc
          .from("lab_reports")
          .update({ status: "error" })
          .eq("id", report.id)
          .catch(() => {});
      }
    });

    return NextResponse.json({ message: "Re-parse started" });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

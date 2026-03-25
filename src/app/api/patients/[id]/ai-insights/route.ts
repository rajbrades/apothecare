import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { createAiInsightSchema } from "@/lib/validations/ai-insight";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthPractitioner(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return practitioner;
}

// ── GET /api/patients/[id]/ai-insights ──────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const insightType = request.nextUrl.searchParams.get("insight_type");
    const includeDismissed =
      request.nextUrl.searchParams.get("include_dismissed") === "true";

    let query = supabase
      .from("ai_insights")
      .select("*")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .order("created_at", { ascending: false });

    if (!includeDismissed) {
      query = query.eq("is_dismissed", false);
    }

    if (insightType) {
      query = query.eq("insight_type", insightType);
    }

    const { data, error } = await query;
    if (error) return jsonError("Internal server error", 500);

    return NextResponse.json({ insights: data });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── POST /api/patients/[id]/ai-insights ─────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = createAiInsightSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { data, error } = await supabase
      .from("ai_insights")
      .insert({
        patient_id: patientId,
        practitioner_id: practitioner.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (error) return jsonError("Internal server error", 500);

    auditLog({
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "ai_insight",
      resourceId: data.id,
      detail: {
        patient_id: patientId,
        insight_type: parsed.data.insight_type,
        source_type: parsed.data.source_type,
      },
      request,
    });

    return NextResponse.json({ insight: data }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

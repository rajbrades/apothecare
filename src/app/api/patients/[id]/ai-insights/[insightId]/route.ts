import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { updateAiInsightSchema } from "@/lib/validations/ai-insight";

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

// ── PATCH /api/patients/[id]/ai-insights/[insightId] ────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; insightId: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId, insightId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = updateAiInsightSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { data, error } = await supabase
      .from("ai_insights")
      .update(parsed.data)
      .eq("id", insightId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .select()
      .single();

    if (error) return jsonError("Internal server error", 500);
    if (!data) return jsonError("Insight not found", 404);

    auditLog({
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "ai_insight",
      resourceId: insightId,
      detail: {
        patient_id: patientId,
        fields_updated: Object.keys(parsed.data),
        is_dismissed: parsed.data.is_dismissed,
      },
      request,
    });

    return NextResponse.json({ insight: data });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── DELETE /api/patients/[id]/ai-insights/[insightId] ───────────────
// AI insights use is_dismissed instead of hard delete

export async function DELETE() {
  return NextResponse.json(
    { error: "Use PATCH with is_dismissed: true to dismiss insights" },
    { status: 405 }
  );
}

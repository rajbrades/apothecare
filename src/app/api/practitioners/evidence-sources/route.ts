import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { updateEvidenceSourcesSchema } from "@/lib/validations/practitioner";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthPractitioner(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return practitioner;
}

// ── PUT /api/practitioners/evidence-sources — Save default sources ────

export async function PUT(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = updateEvidenceSourcesSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { error: updateError } = await supabase
      .from("practitioners")
      .update({ preferred_evidence_sources: parsed.data.sources })
      .eq("id", practitioner.id);

    if (updateError) return jsonError("Failed to save preferences", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "evidence_source_preferences",
      detail: { sources: parsed.data.sources },
    });

    return NextResponse.json({ sources: parsed.data.sources });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

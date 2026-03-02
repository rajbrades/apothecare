import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { updateProfileSchema } from "@/lib/validations/settings";
import { validateNpi } from "@/lib/constants/practitioner";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── PATCH /api/practitioners/profile — Update practitioner profile ──

export async function PATCH(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    // Validate NPI if provided
    if (parsed.data.npi) {
      if (!validateNpi(parsed.data.npi)) {
        return jsonError("Invalid NPI — check digit failed", 400);
      }
    }

    const { error: updateError } = await supabase
      .from("practitioners")
      .update(parsed.data)
      .eq("id", practitioner.id);

    if (updateError) return jsonError("Failed to update profile", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "practitioner_profile",
      detail: { fields: Object.keys(parsed.data) },
    });

    return NextResponse.json({ success: true, updated: parsed.data });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

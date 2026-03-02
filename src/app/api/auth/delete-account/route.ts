import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { deleteAccountSchema } from "@/lib/validations/settings";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST /api/auth/delete-account — Delete account + all data ───────

export async function POST(request: NextRequest) {
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
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    // Audit log before deletion
    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "delete",
      resourceType: "account",
    });

    const serviceClient = createServiceClient();
    const pid = practitioner.id;

    // Delete dependent data in order (child tables first)
    // Some may CASCADE from practitioner FK, but explicit deletion is safer
    await serviceClient.from("practitioner_brand_preferences").delete().eq("practitioner_id", pid);
    await serviceClient.from("patient_supplements").delete().eq("practitioner_id", pid);
    await serviceClient.from("symptom_logs").delete().eq("practitioner_id", pid);
    await serviceClient.from("protocol_milestones").delete().eq("practitioner_id", pid);
    await serviceClient.from("patient_reports").delete().eq("practitioner_id", pid);
    await serviceClient.from("ai_insights").delete().eq("practitioner_id", pid);
    await serviceClient.from("timeline_events").delete().eq("practitioner_id", pid);
    await serviceClient.from("biomarker_results").delete().eq("practitioner_id", pid);
    await serviceClient.from("lab_reports").delete().eq("practitioner_id", pid);
    await serviceClient.from("patient_documents").delete().eq("practitioner_id", pid);
    await serviceClient.from("visits").delete().eq("practitioner_id", pid);
    await serviceClient.from("patients").delete().eq("practitioner_id", pid);
    await serviceClient.from("messages").delete().eq("practitioner_id", pid);
    await serviceClient.from("conversations").delete().eq("practitioner_id", pid);
    await serviceClient.from("supplement_reviews").delete().eq("practitioner_id", pid);
    await serviceClient.from("audit_logs").delete().eq("practitioner_id", pid);

    // Delete the practitioner row
    await serviceClient.from("practitioners").delete().eq("id", pid);

    // Delete the auth user
    await serviceClient.auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Account deletion error:", err);
    return jsonError("Internal server error", 500);
  }
}

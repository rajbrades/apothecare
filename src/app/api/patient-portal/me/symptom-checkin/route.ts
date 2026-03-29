import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { symptomCheckinSchema } from "@/lib/validations/symptom-checkin";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/patient-portal/me/symptom-checkin
 * Patient submits a symptom check-in with 0-10 scores.
 */
export async function POST(request: NextRequest) {
  try {
    const csrfError = await validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: patient } = await supabase
      .from("patients")
      .select("id, practitioner_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!patient) return jsonError("Patient not found", 404);

    const body = await request.json();
    const parsed = symptomCheckinSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const { scores, notes } = parsed.data;

    const service = createServiceClient();

    // Insert snapshot
    const { data: snapshot, error: insertError } = await service
      .from("symptom_score_snapshots")
      .insert({
        patient_id: patient.id,
        practitioner_id: patient.practitioner_id,
        scores,
        notes: notes || null,
        source: "check_in",
        recorded_at: new Date().toISOString(),
      })
      .select("id, recorded_at")
      .single();

    if (insertError) {
      console.error("[symptom-checkin] Insert failed:", insertError.message);
      return jsonError("Failed to save check-in", 500);
    }

    // Update patients.symptom_scores with latest values
    await service
      .from("patients")
      .update({ symptom_scores: scores })
      .eq("id", patient.id);

    auditLog({
      request,
      practitionerId: patient.practitioner_id,
      action: "create",
      resourceType: "symptom_checkin",
      resourceId: snapshot.id,
      detail: {
        patient_id: patient.id,
        via: "patient_portal",
        score_count: Object.keys(scores).length,
      },
    });

    return NextResponse.json({
      snapshot_id: snapshot.id,
      recorded_at: snapshot.recorded_at,
    }, { status: 201 });
  } catch (err) {
    console.error("[symptom-checkin] Unhandled error:", err);
    return jsonError("Internal server error", 500);
  }
}

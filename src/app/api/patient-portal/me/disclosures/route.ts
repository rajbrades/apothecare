import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patient-portal/me/disclosures
 *
 * HIPAA §164.528: Patients can view an accounting of disclosures —
 * who accessed their records and when. Returns audit log entries
 * scoped to the patient's record.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: patient } = await supabase
      .from("patients")
      .select("id, practitioner_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!patient) return jsonError("Patient record not found", 404);

    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 100);

    const service = createServiceClient();

    // Query audit logs where the resource is this patient's data, join practitioner name
    let query = service
      .from("audit_logs")
      .select("id, action, resource_type, created_at, detail, practitioner_id, practitioners(full_name)")
      .eq("resource_id", patient.id)
      .in("resource_type", ["patient", "lab_report", "visit", "consent", "intake"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("[Disclosures] DB Error:", error.message);
      return jsonError("Failed to fetch disclosure log", 500);
    }

    // Map to patient-friendly format (strip internal details)
    const disclosures = (logs || []).map((log: {
      id: string;
      action: string;
      resource_type: string;
      created_at: string;
      detail: Record<string, unknown> | null;
      practitioner_id: string;
      practitioners: { full_name: string } | null;
    }) => {
      // Determine who performed the action
      const isPatientAction = ["patient_view_lab", "patient_view_note", "consent_signed", "intake_submitted"].includes(log.action);
      const via = log.detail?.via as string | undefined;
      const isPatientPortal = via === "patient_portal";

      let accessed_by: string;
      if (isPatientAction || isPatientPortal) {
        accessed_by = "You";
      } else if (log.practitioners?.full_name) {
        accessed_by = log.practitioners.full_name;
      } else {
        accessed_by = "Your provider";
      }

      return {
        id: log.id,
        action: formatAction(log.action),
        resource_type: formatResourceType(log.resource_type),
        accessed_at: log.created_at,
        accessed_by,
        detail: log.detail?.purpose || null,
      };
    });

    const nextCursor = disclosures.length === limit
      ? disclosures[disclosures.length - 1].accessed_at
      : null;

    // Log the patient viewing their own disclosure log
    auditLog({
      request,
      practitionerId: patient.practitioner_id,
      action: "read",
      resourceType: "disclosure_log",
      resourceId: patient.id,
      detail: { accessed_by: "patient", patient_id: patient.id },
    });

    return NextResponse.json({ disclosures, nextCursor });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    read: "Viewed",
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    export: "Exported",
    generate: "Generated",
    upload: "Uploaded",
    query: "Queried",
    patient_view_lab: "You viewed lab",
    patient_view_note: "You viewed note",
    consent_signed: "Consent signed",
    intake_submitted: "Intake submitted",
  };
  return map[action] || action;
}

function formatResourceType(type: string): string {
  const map: Record<string, string> = {
    patient: "Patient Record",
    lab_report: "Lab Report",
    visit: "Visit Note",
    consent: "Consent Document",
    intake: "Intake Form",
  };
  return map[type] || type;
}

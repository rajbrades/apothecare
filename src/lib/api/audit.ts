import { createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "login"
  | "logout"
  | "upload"
  | "query"
  | "generate"
  | "transcribe"
  | "sign"
  | "unlock"
  | "prompt_injection_blocked"
  | "prompt_injection_warning"
  | "archive"
  | "unarchive"
  | "retry_extraction"
  | "invite_created"
  | "invite_accepted"
  | "invite_revoked"
  | "invite_resent"
  | "consent_signed"
  | "intake_submitted"
  | "patient_view_lab"
  | "patient_view_note";

interface AuditLogParams {
  request: NextRequest;
  practitionerId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
}

interface AuditLogServerParams {
  practitionerId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
}

/**
 * Write an audit log entry from a Server Component (no NextRequest available).
 * Uses next/headers to extract IP and user-agent. Fire-and-forget.
 */
export function auditLogServer(params: AuditLogServerParams): void {
  headers().then((hdrs) => {
    const clientIp = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = hdrs.get("user-agent") || "unknown";
    const serviceClient = createServiceClient();
    serviceClient
      .from("audit_logs")
      .insert({
        practitioner_id: params.practitionerId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId || null,
        ip_address: clientIp,
        user_agent: userAgent,
        detail: params.detail || {},
      })
      .then(() => {})
      .catch((err: unknown) => { console.error("Audit log write failed:", err); });
  }).catch(() => {});
}

/**
 * Write an audit log entry. Fire-and-forget — does not block the caller
 * and swallows errors (logs to console.error).
 *
 * For HIPAA compliance, all PHI access (reads AND writes) must be logged.
 */
export function auditLog({
  request,
  practitionerId,
  action,
  resourceType,
  resourceId,
  detail,
}: AuditLogParams): void {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const serviceClient = createServiceClient();

  serviceClient
    .from("audit_logs")
    .insert({
      practitioner_id: practitionerId,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      ip_address: clientIp,
      user_agent: userAgent,
      detail: detail || {},
    })
    .then(() => { })
    .catch((err: unknown) => {
      console.error("Audit log write failed:", err);
    });
}

import { createServiceClient } from "@/lib/supabase/server";
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
  | "unlock";

interface AuditLogParams {
  request: NextRequest;
  practitionerId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
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

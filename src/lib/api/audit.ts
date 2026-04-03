import * as Sentry from "@sentry/nextjs";
import { createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

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
 * Uses next/headers to extract IP and user-agent. Fire-and-forget with retry.
 */
export function auditLogServer(params: AuditLogServerParams): void {
  headers().then((hdrs) => {
    const clientIp = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = hdrs.get("user-agent") || "unknown";
    insertWithRetry({
      practitioner_id: params.practitionerId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      ip_address: clientIp,
      user_agent: userAgent,
      detail: params.detail || {},
    }).catch(() => {});
  }).catch(() => {});
}

/**
 * Insert an audit row with retry. Fire-and-forget — does not block the caller.
 * Retries up to MAX_RETRIES on failure. Alerts Sentry on final failure.
 */
async function insertWithRetry(row: Record<string, unknown>): Promise<void> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const serviceClient = createServiceClient();
      const { error } = await serviceClient.from("audit_logs").insert(row);
      if (!error) return;
      throw error;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error(`Audit log write failed after ${MAX_RETRIES + 1} attempts:`, err);
        Sentry.captureException(err, {
          tags: { subsystem: "audit_log", action: row.action as string },
          extra: { resource_type: row.resource_type, resource_id: row.resource_id },
        });
        return;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
}

/**
 * Write an audit log entry. Fire-and-forget — does not block the caller.
 * Retries on transient failures and alerts Sentry on permanent failure.
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

  insertWithRetry({
    practitioner_id: practitionerId,
    action,
    resource_type: resourceType,
    resource_id: resourceId || null,
    ip_address: clientIp,
    user_agent: userAgent,
    detail: detail || {},
  }).catch(() => {});
}

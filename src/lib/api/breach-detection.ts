import { createServiceClient } from "@/lib/supabase/server";

/**
 * HIPAA M3: Basic breach detection via audit log anomaly thresholds.
 *
 * Checks for anomalous patterns and logs warnings. In production,
 * these would trigger email/Slack alerts.
 */

interface AnomalyAlert {
  type: string;
  severity: "warning" | "critical";
  message: string;
  detail: Record<string, unknown>;
}

const THRESHOLDS = {
  /** Max exports per practitioner per hour */
  EXPORTS_PER_HOUR: 5,
  /** Max patient record views per practitioner per hour */
  PATIENT_VIEWS_PER_HOUR: 100,
  /** Max failed auth attempts per IP per hour */
  FAILED_AUTH_PER_IP_PER_HOUR: 10,
};

/**
 * Check for anomalous export volume from a specific practitioner.
 * Call after each export action.
 */
export async function checkExportAnomaly(practitionerId: string): Promise<AnomalyAlert | null> {
  try {
    const service = createServiceClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await service
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("practitioner_id", practitionerId)
      .eq("action", "export")
      .gte("created_at", oneHourAgo);

    if (count && count >= THRESHOLDS.EXPORTS_PER_HOUR) {
      const alert: AnomalyAlert = {
        type: "excessive_exports",
        severity: "critical",
        message: `Practitioner ${practitionerId} has ${count} exports in the last hour (threshold: ${THRESHOLDS.EXPORTS_PER_HOUR})`,
        detail: { practitioner_id: practitionerId, count, threshold: THRESHOLDS.EXPORTS_PER_HOUR },
      };
      console.warn(`[BREACH DETECTION] ${alert.severity.toUpperCase()}: ${alert.message}`);

      // Log the alert itself as an audit event
      await service.from("audit_logs").insert({
        practitioner_id: practitionerId,
        action: "prompt_injection_warning",
        resource_type: "breach_detection",
        detail: alert,
      });

      return alert;
    }
  } catch (err) {
    console.error("[Breach Detection] Export check failed:", err);
  }
  return null;
}

/**
 * Check for anomalous patient record access volume.
 * Call periodically or after bulk access patterns.
 */
export async function checkAccessAnomaly(practitionerId: string): Promise<AnomalyAlert | null> {
  try {
    const service = createServiceClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await service
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("practitioner_id", practitionerId)
      .eq("action", "read")
      .eq("resource_type", "patient")
      .gte("created_at", oneHourAgo);

    if (count && count >= THRESHOLDS.PATIENT_VIEWS_PER_HOUR) {
      const alert: AnomalyAlert = {
        type: "excessive_access",
        severity: "warning",
        message: `Practitioner ${practitionerId} has ${count} patient record views in the last hour (threshold: ${THRESHOLDS.PATIENT_VIEWS_PER_HOUR})`,
        detail: { practitioner_id: practitionerId, count, threshold: THRESHOLDS.PATIENT_VIEWS_PER_HOUR },
      };
      console.warn(`[BREACH DETECTION] ${alert.severity.toUpperCase()}: ${alert.message}`);

      await service.from("audit_logs").insert({
        practitioner_id: practitionerId,
        action: "prompt_injection_warning",
        resource_type: "breach_detection",
        detail: alert,
      });

      return alert;
    }
  } catch (err) {
    console.error("[Breach Detection] Access check failed:", err);
  }
  return null;
}

/**
 * Run all breach detection checks for a practitioner.
 * Returns any triggered alerts.
 */
export async function runBreachDetection(practitionerId: string): Promise<AnomalyAlert[]> {
  const alerts: AnomalyAlert[] = [];

  const exportAlert = await checkExportAnomaly(practitionerId);
  if (exportAlert) alerts.push(exportAlert);

  const accessAlert = await checkAccessAnomaly(practitionerId);
  if (accessAlert) alerts.push(accessAlert);

  return alerts;
}

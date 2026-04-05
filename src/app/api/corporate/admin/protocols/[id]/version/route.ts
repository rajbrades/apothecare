import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/corporate/admin/protocols/[id]/version
 * Create a new version of an existing protocol.
 * Copies the protocol + all steps/monitoring/rules as a new draft.
 * The original remains active (immutable once assigned to patients).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const { data: membership } = await supabase
      .from("corporate_provider_memberships")
      .select("corporate_id")
      .eq("practitioner_id", practitioner.id)
      .eq("role", "admin")
      .eq("is_active", true)
      .single();
    if (!membership) return jsonError("Unauthorized — corporate admin required", 403);

    // Use service client for cross-table copy (RLS would complicate inserts)
    const service = createServiceClient();

    // Fetch original protocol
    const { data: original } = await service
      .from("corporate_protocols")
      .select("*")
      .eq("id", id)
      .eq("corporate_id", membership.corporate_id)
      .single();

    if (!original) return jsonError("Protocol not found", 404);

    // Create new version as draft
    const { data: newProtocol, error: createError } = await service
      .from("corporate_protocols")
      .insert({
        corporate_id: original.corporate_id,
        title: original.title,
        description: original.description,
        category: original.category,
        version: original.version + 1,
        status: "draft",
        authored_by: original.authored_by,
        tags: original.tags,
      })
      .select("id, version")
      .single();

    if (createError || !newProtocol) return jsonError("Failed to create new version", 500);

    // Copy steps
    const { data: steps } = await service
      .from("corporate_protocol_steps")
      .select("*")
      .eq("protocol_id", id);

    if (steps && steps.length > 0) {
      await service.from("corporate_protocol_steps").insert(
        steps.map((s: Record<string, unknown>) => ({
          ...s,
          id: undefined, // let DB generate new IDs
          protocol_id: newProtocol.id,
        }))
      );
    }

    // Copy monitoring
    const { data: monitoring } = await service
      .from("corporate_protocol_monitoring")
      .select("*")
      .eq("protocol_id", id);

    if (monitoring && monitoring.length > 0) {
      await service.from("corporate_protocol_monitoring").insert(
        monitoring.map((m: Record<string, unknown>) => ({
          ...m,
          id: undefined,
          protocol_id: newProtocol.id,
        }))
      );
    }

    // Copy decision rules
    const { data: rules } = await service
      .from("protocol_decision_rules")
      .select("*")
      .eq("protocol_id", id);

    if (rules && rules.length > 0) {
      await service.from("protocol_decision_rules").insert(
        rules.map((r: Record<string, unknown>) => ({
          ...r,
          id: undefined,
          protocol_id: newProtocol.id,
        }))
      );
    }

    // Copy evidence conflicts
    const { data: conflicts } = await service
      .from("corporate_protocol_evidence_conflicts")
      .select("*")
      .eq("protocol_id", id);

    if (conflicts && conflicts.length > 0) {
      await service.from("corporate_protocol_evidence_conflicts").insert(
        conflicts.map((c: Record<string, unknown>) => ({
          ...c,
          id: undefined,
          protocol_id: newProtocol.id,
        }))
      );
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "corporate_protocol",
      resourceId: newProtocol.id,
      detail: { action: "version", from_protocol_id: id, new_version: newProtocol.version },
    });

    return NextResponse.json({
      id: newProtocol.id,
      version: newProtocol.version,
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

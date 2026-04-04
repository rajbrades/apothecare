import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/corporate/protocols/[id]
 * Full protocol detail: steps, monitoring, evidence conflicts, decision rules.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Fetch protocol (RLS handles corporate membership check)
    const [
      { data: protocol },
      { data: steps },
      { data: monitoring },
      { data: evidenceConflicts },
      { data: decisionRules },
    ] = await Promise.all([
      supabase
        .from("corporate_protocols")
        .select("*, corporate_accounts(name, slug, logo_url, branding)")
        .eq("id", id)
        .single(),
      supabase
        .from("corporate_protocol_steps")
        .select("*")
        .eq("protocol_id", id)
        .order("step_order"),
      supabase
        .from("corporate_protocol_monitoring")
        .select("*")
        .eq("protocol_id", id)
        .order("sort_order"),
      supabase
        .from("corporate_protocol_evidence_conflicts")
        .select("*")
        .eq("protocol_id", id),
      supabase
        .from("protocol_decision_rules")
        .select("*")
        .eq("protocol_id", id)
        .eq("is_active", true),
    ]);

    if (!protocol) return jsonError("Protocol not found", 404);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "corporate_protocol",
      resourceId: id,
    });

    return NextResponse.json({
      protocol: {
        ...protocol,
        steps: steps || [],
        monitoring: monitoring || [],
        evidence_conflicts: evidenceConflicts || [],
        decision_rules: decisionRules || [],
      },
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

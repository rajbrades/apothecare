import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";
import { isFeatureAvailable, proPlusGateResponse } from "@/lib/tier/gates";
import { randomUUID } from "crypto";
import {
  buildLetterhead,
  buildPatientBar,
  buildFooter,
  buildExportPage,
  fetchLogoAsBase64,
  EXPORT_HEADERS,
} from "@/lib/export/shared";
import { buildProtocolBody } from "@/lib/export/protocol";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/patients/[id]/protocols/[protocolId]/export
 * Generate a branded, printable treatment protocol PDF.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; protocolId: string }> }
) {
  const { id: patientId, protocolId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();
  if (!practitioner) return jsonError("Practitioner not found", 404);

  if (!isFeatureAvailable(practitioner.subscription_tier, "multi_phase_protocols")) {
    return proPlusGateResponse(NextResponse, "Protocol export");
  }

  const [{ data: protocol }, { data: phases }, { data: patient }] = await Promise.all([
    supabase
      .from("treatment_protocols")
      .select("*")
      .eq("id", protocolId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single(),
    supabase
      .from("protocol_phases")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("phase_number", { ascending: true }),
    supabase
      .from("patients")
      .select("first_name, last_name, date_of_birth, sex")
      .eq("id", patientId)
      .single(),
  ]);

  if (!protocol) return jsonError("Protocol not found", 404);
  if (!phases || phases.length === 0) return jsonError("No phases found", 404);

  const exportSessionId = randomUUID();
  const exportedAt = new Date().toISOString();

  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "export",
    resourceType: "treatment_protocol",
    resourceId: protocolId,
    detail: { export_session_id: exportSessionId, phase_count: phases.length },
  });

  const logoDataUri = await fetchLogoAsBase64(practitioner.logo_storage_path);

  const letterhead = buildLetterhead(
    "",
    "",
    practitioner,
    logoDataUri
  );

  const patientBar = buildPatientBar(patient);

  const protocolBody = buildProtocolBody(phases, {
    title: protocol.title,
    focus_areas: protocol.focus_areas || [],
    total_duration_weeks: protocol.total_duration_weeks,
    status: protocol.status,
  });

  const footer = buildFooter(
    "This protocol is for clinical reference only. It does not constitute medical advice.",
    exportSessionId,
    exportedAt
  );

  const body = `${letterhead}\n${patientBar}\n${protocolBody}\n${footer}`;
  const html = buildExportPage(
    `Treatment Protocol — ${protocol.title}`,
    body
  );

  return new Response(html, { headers: EXPORT_HEADERS });
}

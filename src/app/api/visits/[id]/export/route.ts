import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";
import { randomUUID } from "crypto";
import {
  buildLetterhead,
  buildPatientBar,
  buildFooter,
  buildExportPage,
  fetchLogoAsBase64,
  escapeHtml,
  EXPORT_HEADERS,
} from "@/lib/export/shared";
import { proGateResponse } from "@/lib/tier/gates";

/**
 * GET /api/visits/[id]/export — Generate a branded, printable visit note.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();
  if (!practitioner) {
    return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
  }

  // Branded PDF exports are a Pro feature
  if (practitioner.subscription_tier !== "pro") {
    return proGateResponse(NextResponse, "Branded PDF exports");
  }

  const { data: visit } = await supabase
    .from("visits")
    .select("*, patients(first_name, last_name, date_of_birth, sex)")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  const exportSessionId = randomUUID();
  const exportedAt = new Date().toISOString();

  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "export",
    resourceType: "visit",
    resourceId: id,
    detail: { export_session_id: exportSessionId },
  });

  const logoDataUri = await fetchLogoAsBase64(practitioner.logo_storage_path);

  const visitDate = new Date(visit.visit_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const visitTypeLabel: Record<string, string> = {
    soap: "SOAP",
    follow_up: "Follow-up",
    history_physical: "H&P",
    consult: "Consultation",
  };

  const letterhead = buildLetterhead(
    "Visit Note",
    visit.chief_complaint || "",
    practitioner,
    logoDataUri
  );

  const patientBar = buildPatientBar(visit.patients, {
    Date: visitDate,
    Type: visitTypeLabel[visit.visit_type] || visit.visit_type,
    Status: visit.status === "completed" ? "Completed" : "Draft",
  });

  const sections = [
    { label: "Subjective", content: visit.subjective },
    { label: "Objective", content: visit.objective },
    { label: "Assessment", content: visit.assessment },
    { label: "Plan", content: visit.plan },
  ]
    .filter((s) => s.content)
    .map(
      (s) => `
  <div class="section">
    <div class="section-label">${s.label}</div>
    <div class="section-content">${escapeHtml(s.content)}</div>
  </div>`
    )
    .join("");

  const footer = buildFooter(
    "AI-generated content. Review and verify before clinical use.",
    exportSessionId,
    exportedAt
  );

  const body = `${letterhead}\n${patientBar}\n${sections}\n${footer}`;
  const html = buildExportPage(
    `Visit Note — ${visit.chief_complaint || "Visit"}`,
    body
  );

  return new Response(html, { headers: EXPORT_HEADERS });
}

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
  EXPORT_HEADERS,
} from "@/lib/export/shared";
import { buildLabReportBody } from "@/lib/export/lab-report";

/**
 * GET /api/labs/[id]/export — Generate a branded, printable lab report.
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

  const { data: lab } = await supabase
    .from("lab_reports")
    .select("*, patients(first_name, last_name, date_of_birth, sex)")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (!lab) {
    return NextResponse.json({ error: "Lab report not found" }, { status: 404 });
  }

  const { data: biomarkers } = await supabase
    .from("biomarker_results")
    .select("*")
    .eq("lab_report_id", id)
    .order("category")
    .order("biomarker_name");

  if (!biomarkers || biomarkers.length === 0) {
    return NextResponse.json({ error: "No biomarker results found" }, { status: 404 });
  }

  const exportSessionId = randomUUID();
  const exportedAt = new Date().toISOString();

  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "export",
    resourceType: "lab_report",
    resourceId: id,
    detail: { export_session_id: exportSessionId, biomarker_count: biomarkers.length },
  });

  const logoDataUri = await fetchLogoAsBase64(practitioner.logo_storage_path);

  const letterhead = buildLetterhead(
    "Lab Report",
    lab.test_name || "",
    practitioner,
    logoDataUri
  );

  const patientBar = buildPatientBar(lab.patients);

  const labBody = buildLabReportBody(biomarkers, {
    test_name: lab.test_name,
    lab_vendor: lab.lab_vendor,
    collection_date: lab.collection_date,
  });

  const footer = buildFooter(
    "This report is for clinical reference only. It does not constitute a diagnosis.",
    exportSessionId,
    exportedAt
  );

  const body = `${letterhead}\n${patientBar}\n${labBody}\n${footer}`;
  const html = buildExportPage(
    `Lab Report — ${lab.test_name || "Lab"} — ${lab.collection_date || ""}`,
    body
  );

  return new Response(html, { headers: EXPORT_HEADERS });
}

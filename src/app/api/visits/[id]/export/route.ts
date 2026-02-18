import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

/**
 * GET /api/visits/[id]/export — Generate a simple HTML-based printable document.
 *
 * Uses the browser's print-to-PDF capability rather than a server-side PDF library,
 * keeping the dependency footprint minimal. The response is a styled HTML page
 * that opens in a new tab and can be printed/saved as PDF.
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
    .select("id, full_name, license_type, npi, practice_name")
    .eq("auth_user_id", user.id)
    .single();
  if (!practitioner) {
    return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
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

  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "export",
    resourceType: "visit",
    resourceId: id,
  });

  const patientName = visit.patients
    ? [visit.patients.first_name, visit.patients.last_name].filter(Boolean).join(" ")
    : "No patient linked";

  const visitDate = new Date(visit.visit_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const escapeHtml = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Visit Note — ${visit.chief_complaint || "Visit"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a2e2a;
      max-width: 7.5in;
      margin: 0.5in auto;
      padding: 0 0.5in;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2d7a6e;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-family: 'Newsreader', serif;
      font-size: 18pt;
      color: #2d7a6e;
    }
    .header .meta {
      text-align: right;
      font-size: 9pt;
      color: #4a6660;
    }

    .patient-bar {
      display: flex;
      gap: 24px;
      background: #f8fafb;
      border: 1px solid #e2ece9;
      border-radius: 6px;
      padding: 10px 16px;
      margin-bottom: 20px;
      font-size: 9pt;
    }
    .patient-bar strong { color: #1a2e2a; }

    .section { margin-bottom: 20px; }
    .section-label {
      display: inline-block;
      background: #2d7a6e;
      color: white;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 3px;
      margin-bottom: 8px;
    }
    .section-content {
      padding-left: 4px;
      white-space: pre-wrap;
    }

    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e2ece9;
      font-size: 8pt;
      color: #7a9690;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      body { margin: 0; padding: 0.25in; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; margin-bottom: 20px; font-size: 10pt;">
    Use <strong>Ctrl/Cmd + P</strong> to print or save as PDF
  </div>

  <div class="header">
    <div>
      <h1>Visit Note</h1>
      <div style="font-size: 10pt; color: #4a6660; margin-top: 4px;">
        ${visit.chief_complaint ? escapeHtml(visit.chief_complaint) : ""}
      </div>
    </div>
    <div class="meta">
      <div><strong>${escapeHtml(practitioner.full_name)}</strong></div>
      ${practitioner.license_type ? `<div>${practitioner.license_type.toUpperCase()}</div>` : ""}
      ${practitioner.npi ? `<div>NPI: ${escapeHtml(practitioner.npi)}</div>` : ""}
      ${practitioner.practice_name ? `<div>${escapeHtml(practitioner.practice_name)}</div>` : ""}
    </div>
  </div>

  <div class="patient-bar">
    <div><strong>Patient:</strong> ${escapeHtml(patientName)}</div>
    <div><strong>Date:</strong> ${visitDate}</div>
    <div><strong>Type:</strong> ${visit.visit_type === "follow_up" ? "Follow-up" : "SOAP"}</div>
    <div><strong>Status:</strong> ${visit.status === "completed" ? "Completed" : "Draft"}</div>
  </div>

  ${visit.subjective ? `
  <div class="section">
    <div class="section-label">Subjective</div>
    <div class="section-content">${escapeHtml(visit.subjective)}</div>
  </div>` : ""}

  ${visit.objective ? `
  <div class="section">
    <div class="section-label">Objective</div>
    <div class="section-content">${escapeHtml(visit.objective)}</div>
  </div>` : ""}

  ${visit.assessment ? `
  <div class="section">
    <div class="section-label">Assessment</div>
    <div class="section-content">${escapeHtml(visit.assessment)}</div>
  </div>` : ""}

  ${visit.plan ? `
  <div class="section">
    <div class="section-label">Plan</div>
    <div class="section-content">${escapeHtml(visit.plan)}</div>
  </div>` : ""}

  <div class="footer">
    <div>Generated with Apotheca — AI Clinical Decision Support</div>
    <div>AI-generated content. Review and verify before clinical use.</div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

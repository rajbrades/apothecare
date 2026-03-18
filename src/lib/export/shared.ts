/**
 * Shared export template builders for Apothecare PDF exports.
 * All export routes use these functions to build consistent, branded HTML.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { EXPORT_STYLES } from "./styles";

const BUCKET = "practice-assets";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

/**
 * Fetch the practitioner's logo from Supabase Storage and return as a base64 data URI.
 * Returns null if no logo is configured or the download fails.
 */
export async function fetchLogoAsBase64(
  logoStoragePath: string | null
): Promise<string | null> {
  if (!logoStoragePath) return null;

  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient.storage
      .from(BUCKET)
      .download(logoStoragePath);

    if (error || !data) return null;

    const arrayBuffer = await data.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const ext = logoStoragePath.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
      webp: "image/webp",
    };
    const mime = mimeMap[ext || ""] || "image/png";
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

interface PractitionerInfo {
  full_name: string;
  license_type?: string | null;
  npi?: string | null;
  practice_name?: string | null;
  practice_address_line1?: string | null;
  practice_address_line2?: string | null;
  practice_city?: string | null;
  practice_state?: string | null;
  practice_zip?: string | null;
  practice_phone?: string | null;
  practice_fax?: string | null;
  practice_website?: string | null;
}

/**
 * Build the letterhead header with optional logo and practice info.
 */
export function buildLetterhead(
  title: string,
  subtitle: string,
  practitioner: PractitionerInfo,
  logoDataUri: string | null
): string {
  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="Practice logo" class="letterhead-logo" />`
    : "";

  const credentials = [
    escapeHtml(practitioner.full_name),
    practitioner.license_type ? practitioner.license_type.toUpperCase() : null,
    practitioner.npi ? `NPI: ${escapeHtml(practitioner.npi)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const addressParts = [
    practitioner.practice_address_line1,
    practitioner.practice_address_line2,
  ].filter(Boolean);

  const cityStateZip = [
    practitioner.practice_city,
    practitioner.practice_state,
  ]
    .filter(Boolean)
    .join(", ");
  if (practitioner.practice_zip) {
    if (cityStateZip) {
      addressParts.push(`${cityStateZip} ${practitioner.practice_zip}`);
    } else {
      addressParts.push(practitioner.practice_zip);
    }
  } else if (cityStateZip) {
    addressParts.push(cityStateZip);
  }

  const contactParts = [
    practitioner.practice_phone,
    practitioner.practice_fax ? `Fax: ${practitioner.practice_fax}` : null,
    practitioner.practice_website,
  ].filter(Boolean);

  return `
  <div class="letterhead">
    <div class="letterhead-left">
      ${logoHtml}
      <div>
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}
      </div>
    </div>
    <div class="meta">
      <div><strong>${credentials}</strong></div>
      ${practitioner.practice_name ? `<div>${escapeHtml(practitioner.practice_name)}</div>` : ""}
      ${addressParts.map((a) => `<div>${escapeHtml(a!)}</div>`).join("")}
      ${contactParts.length ? `<div>${contactParts.map((c) => escapeHtml(c!)).join(" | ")}</div>` : ""}
    </div>
  </div>`;
}

interface PatientInfo {
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  sex?: string | null;
}

/**
 * Build the patient demographics bar.
 */
export function buildPatientBar(
  patient: PatientInfo | null,
  extras?: Record<string, string>
): string {
  if (!patient) return "";

  const name = [patient.first_name, patient.last_name]
    .filter(Boolean)
    .join(" ") || "No patient linked";

  const dob = patient.date_of_birth
    ? new Date(patient.date_of_birth + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" }
      )
    : null;

  const fields: Record<string, string> = { Patient: name };
  if (dob) fields["DOB"] = dob;
  if (patient.sex) fields["Sex"] = patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1);
  if (extras) Object.assign(fields, extras);

  const cells = Object.entries(fields)
    .map(
      ([label, value]) =>
        `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`
    )
    .join("\n    ");

  return `<div class="patient-bar">\n    ${cells}\n  </div>`;
}

/**
 * Build the footer with disclaimer and watermark.
 */
export function buildFooter(
  disclaimer: string,
  exportSessionId: string,
  exportedAt: string
): string {
  return `
  <div class="footer">
    <div>Generated with Apothecare — AI Clinical Decision Support</div>
    <div>${escapeHtml(disclaimer)}</div>
  </div>
  <div class="watermark">
    Export ID: ${exportSessionId} · ${exportedAt} · Do not share without authorization
  </div>`;
}

/**
 * Wrap content in a full HTML document with print styles.
 */
export function buildExportPage(
  title: string,
  body: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>${EXPORT_STYLES}</style>
</head>
<body>
  <div class="no-print">
    Use <strong>Ctrl/Cmd + P</strong> to print or save as PDF
  </div>
  ${body}
</body>
</html>`;
}

/**
 * Standard response headers for all export routes (HIPAA cache prevention).
 */
export const EXPORT_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, no-cache, no-transform, private",
  "Pragma": "no-cache",
  "Expires": "0",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

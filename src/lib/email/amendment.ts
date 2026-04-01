import { sendEmail } from "./resend";
import { env } from "@/lib/env";

const BRAND_GREEN = "#3d8b6e";
const BG = "#f4f7f5";

function baseWrapper(content: string): string {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_GREEN};border-radius:10px 10px 0 0;padding:24px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="width:32px;height:32px;background-color:rgba(255,255,255,0.2);border-radius:50%;display:inline-block;text-align:center;line-height:32px;font-size:16px;font-weight:700;color:#ffffff;">A</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:15px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">Apothecare</span>
                    <span style="font-size:15px;font-weight:400;color:rgba(255,255,255,0.7);"> | Patient Portal</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-radius:0 0 10px 10px;border:1px solid #e2e8f0;border-top:none;">
              ${content}
              <hr style="border:none;border-top:1px solid #e8f0eb;margin:28px 0 20px;" />
              <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0;">
                Apothecare Patient Portal &nbsp;·&nbsp; HIPAA Compliant &nbsp;·&nbsp;
                <a href="${appUrl}/portal/dashboard" style="color:#9ca3af;">portal.apothecare.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Patient: request received ────────────────────────────────────────────────

export interface AmendmentReceivedOptions {
  to: string;
  patientFirstName: string | null;
  fieldLabel: string;
  requestedValue: string;
}

export async function sendAmendmentReceivedEmail(opts: AmendmentReceivedOptions) {
  const greeting = opts.patientFirstName ? `Hi ${opts.patientFirstName},` : "Hi,";
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Amendment Request Received</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
      We've received your request to update your health record. Your provider will review it and respond within <strong>30 days</strong> as required by HIPAA §164.526.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#f8faf9;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Field</p>
          <p style="margin:0 0 14px;font-size:14px;color:#0f172a;">${opts.fieldLabel}</p>
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Requested Change</p>
          <p style="margin:0;font-size:14px;color:#0f172a;">${opts.requestedValue}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7280;line-height:1.6;">
      You'll receive another email when your provider reviews the request. You can also check the status at any time in your portal.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="background-color:${BRAND_GREEN};border-radius:7px;padding:0;">
          <a href="${appUrl}/portal/amendments" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
            View My Requests
          </a>
        </td>
      </tr>
    </table>`;

  return sendEmail({
    to: opts.to,
    subject: "Amendment request received — Apothecare",
    html: baseWrapper(content),
    text: `${greeting}\n\nWe received your request to update "${opts.fieldLabel}" to: ${opts.requestedValue}.\n\nYour provider will review it within 30 days. Check status at ${appUrl}/portal/amendments`,
  });
}

// ── Patient: request reviewed ────────────────────────────────────────────────

export interface AmendmentReviewedOptions {
  to: string;
  patientFirstName: string | null;
  fieldLabel: string;
  action: "approved" | "denied";
  reviewerNote?: string | null;
}

export async function sendAmendmentReviewedEmail(opts: AmendmentReviewedOptions) {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const greeting = opts.patientFirstName ? `Hi ${opts.patientFirstName},` : "Hi,";
  const approved = opts.action === "approved";

  const statusColor = approved ? "#16a34a" : "#dc2626";
  const statusBg = approved ? "#f0fdf4" : "#fef2f2";
  const statusBorder = approved ? "#bbf7d0" : "#fecaca";
  const statusText = approved ? "Approved" : "Denied";
  const actionCopy = approved
    ? "Your health record has been updated accordingly."
    : "Your record was not changed. If you have questions, please contact your provider.";

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Amendment Request ${statusText}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
      Your provider has reviewed your amendment request for <strong>${opts.fieldLabel}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background-color:${statusBg};border:1px solid ${statusBorder};border-radius:8px;margin-bottom:20px;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-size:14px;font-weight:600;color:${statusColor};">
            ${statusText}: ${opts.fieldLabel}
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">${actionCopy}</p>
    ${opts.reviewerNote ? `
    <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#f8faf9;border-left:3px solid ${BRAND_GREEN};margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Provider Note</p>
          <p style="margin:0;font-size:13px;color:#374151;line-height:1.5;font-style:italic;">${opts.reviewerNote}</p>
        </td>
      </tr>
    </table>` : ""}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="background-color:${BRAND_GREEN};border-radius:7px;padding:0;">
          <a href="${appUrl}/portal/amendments" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
            View My Requests
          </a>
        </td>
      </tr>
    </table>`;

  return sendEmail({
    to: opts.to,
    subject: `Amendment request ${statusText.toLowerCase()} — Apothecare`,
    html: baseWrapper(content),
    text: `${greeting}\n\nYour amendment request for "${opts.fieldLabel}" has been ${statusText.toLowerCase()}.\n${actionCopy}${opts.reviewerNote ? `\n\nProvider note: ${opts.reviewerNote}` : ""}\n\nView details: ${appUrl}/portal/amendments`,
  });
}

// ── Practitioner: new request alert ─────────────────────────────────────────

export interface AmendmentAlertOptions {
  to: string;
  practitionerFirstName: string | null;
  patientName: string;
  fieldLabel: string;
  requestedValue: string;
  reason: string;
  patientId: string;
}

export async function sendAmendmentAlertEmail(opts: AmendmentAlertOptions) {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const greeting = opts.practitionerFirstName ? `Hi ${opts.practitionerFirstName},` : "Hi,";
  const reviewUrl = `${appUrl}/patients/${opts.patientId}#amendments`;

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">New Amendment Request</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
      <strong>${opts.patientName}</strong> has submitted an amendment request to their health record.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#f8faf9;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Patient</p>
          <p style="margin:0 0 14px;font-size:14px;color:#0f172a;">${opts.patientName}</p>
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Field</p>
          <p style="margin:0 0 14px;font-size:14px;color:#0f172a;">${opts.fieldLabel}</p>
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Requested Change</p>
          <p style="margin:0 0 14px;font-size:14px;color:#0f172a;">${opts.requestedValue}</p>
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Reason</p>
          <p style="margin:0;font-size:14px;color:#0f172a;">${opts.reason}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7280;line-height:1.6;">
      Per HIPAA §164.526, you must respond within <strong>60 days</strong> (with one 30-day extension if needed).
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="background-color:${BRAND_GREEN};border-radius:7px;padding:0;">
          <a href="${reviewUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
            Review Request
          </a>
        </td>
      </tr>
    </table>`;

  return sendEmail({
    to: opts.to,
    subject: `Amendment request from ${opts.patientName} — Apothecare`,
    html: baseWrapper(content),
    text: `${greeting}\n\n${opts.patientName} has submitted an amendment request.\n\nField: ${opts.fieldLabel}\nRequested: ${opts.requestedValue}\nReason: ${opts.reason}\n\nReview: ${reviewUrl}`,
  });
}

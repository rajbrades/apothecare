import { sendEmail } from "./resend";
import { env } from "@/lib/env";

export interface SendInviteEmailOptions {
  to: string;
  patientFirstName: string | null;
  practitionerName: string;
  practiceName: string | null;
  portalSlug: string;
  rawToken: string;
  expiresInHours?: number;
}

export async function sendPatientInviteEmail(opts: SendInviteEmailOptions): Promise<{ id: string }> {
  const {
    to,
    patientFirstName,
    practitionerName,
    practiceName,
    portalSlug,
    rawToken,
    expiresInHours = 72,
  } = opts;

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const acceptUrl = `${appUrl}/portal/accept?token=${rawToken}&slug=${portalSlug}`;
  const greeting = patientFirstName ? `Hi ${patientFirstName},` : "Hi,";
  const practiceLabel = practiceName || practitionerName;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Patient Portal Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:28px 40px;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">Apothecare</p>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Patient Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:15px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
                <strong>${practitionerName}</strong>${practiceName ? ` at <strong>${practiceName}</strong>` : ""} has invited you to access your patient portal — a secure space to view your lab results, encounter notes, and complete your onboarding forms.
              </p>
              <p style="margin:0 0 32px;color:#334155;font-size:15px;line-height:1.6;">
                This invitation expires in <strong>${expiresInHours} hours</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background-color:#0f172a;border-radius:6px;padding:14px 28px;">
                    <a href="${acceptUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 32px;word-break:break-all;">
                <a href="${acceptUrl}" style="color:#2563eb;font-size:13px;">${acceptUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;" />
              <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.6;">
                <strong>Bookmark for future visits:</strong> After activating your account, you can always sign in at
                <a href="${appUrl}/portal/login" style="color:#2563eb;">${appUrl}/portal/login</a>
              </p>
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                This invitation was sent by ${practiceLabel}. If you didn't expect this email, you can safely ignore it. This link can only be used once and will expire automatically.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${greeting}

${practitionerName}${practiceName ? ` at ${practiceName}` : ""} has invited you to your patient portal.

Accept your invitation here (expires in ${expiresInHours} hours):
${acceptUrl}

Bookmark for future visits: After activating your account, you can always sign in at ${appUrl}/portal/login

If you didn't expect this email, you can safely ignore it.`;

  return sendEmail({
    to,
    subject: `Your invitation to ${practiceLabel}'s patient portal`,
    html,
    text,
  });
}

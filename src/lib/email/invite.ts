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
<body style="margin:0;padding:0;background-color:#f4f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="width:36px;height:36px;background-color:#3d8b6e;border-radius:50%;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;line-height:36px;">A</span>
                  </td>
                  <td style="padding-left:10px;">
                    <p style="margin:0;color:#111827;font-size:18px;font-weight:600;letter-spacing:-0.3px;">Apothecare <span style="color:#6b7280;font-weight:400;">| Patient Portal</span></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#e5e7eb;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px 40px;">
              <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                <strong>${practitionerName}</strong>${practiceName ? ` at <strong>${practiceName}</strong>` : ""} has invited you to access your patient portal — a secure space to view your lab results, encounter notes, and complete your onboarding forms.
              </p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                This invitation expires in <strong>${expiresInHours} hours</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background-color:#3d8b6e;border-radius:8px;padding:14px 32px;">
                    <a href="${acceptUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;line-height:1.5;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 28px;word-break:break-all;text-align:center;">
                <a href="${acceptUrl}" style="color:#3d8b6e;font-size:12px;">${acceptUrl}</a>
              </p>
              <div style="height:1px;background-color:#e5e7eb;margin:0 0 20px;"></div>
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
                This invitation was sent by ${practiceLabel}. If you didn't expect this email, you can safely ignore it. This link can only be used once and will expire automatically.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px;background-color:#f0f5f2;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-align:center;">Secured by Apothecare &middot; HIPAA Compliant</p>
              <p style="margin:0;color:#9ca3af;font-size:10px;text-align:center;">apothecare.ai</p>
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

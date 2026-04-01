import { sendEmail } from "./resend";
import { env } from "@/lib/env";

export interface SendMagicLinkEmailOptions {
  to: string;
  magicLinkUrl: string;
}

export async function sendMagicLinkEmail(opts: SendMagicLinkEmailOptions): Promise<{ id: string }> {
  const { to, magicLinkUrl } = opts;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to your Patient Portal</title>
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
              <p style="margin:0 0 16px;color:#0f172a;font-size:15px;line-height:1.6;">Hi,</p>
              <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
                Click the button below to securely sign in to your patient portal. This link expires in <strong>10 minutes</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background-color:#0f172a;border-radius:6px;padding:14px 28px;">
                    <a href="${magicLinkUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
                      Sign In to Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 32px;word-break:break-all;">
                <a href="${magicLinkUrl}" style="color:#2563eb;font-size:13px;">${magicLinkUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;" />
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                If you didn't request this sign-in link, you can safely ignore this email. This link can only be used once.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
                Secured by Apothecare &middot; HIPAA Compliant &middot; ${env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "")}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Sign in to your Patient Portal

Click the link below to securely sign in (expires in 10 minutes):
${magicLinkUrl}

If you didn't request this, you can safely ignore this email.`;

  return sendEmail({
    to,
    subject: "Sign in to your Apothecare Patient Portal",
    html,
    text,
  });
}

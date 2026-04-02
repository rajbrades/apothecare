import { sendEmail } from "./resend";
import { env } from "@/lib/env";

export interface SendMagicLinkEmailOptions {
  to: string;
  magicLinkUrl: string;
}

export async function sendMagicLinkEmail(opts: SendMagicLinkEmailOptions): Promise<{ id: string }> {
  const { to, magicLinkUrl } = opts;

  const domain = env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "apothecare.ai";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to your Patient Portal</title>
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
              <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Hi,</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                Click the button below to securely sign in to your patient portal. This link expires in <strong>10 minutes</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background-color:#3d8b6e;border-radius:8px;padding:14px 32px;">
                    <a href="${magicLinkUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
                      Sign In to Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;line-height:1.5;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 28px;word-break:break-all;text-align:center;">
                <a href="${magicLinkUrl}" style="color:#3d8b6e;font-size:12px;">${magicLinkUrl}</a>
              </p>
              <div style="height:1px;background-color:#e5e7eb;margin:0 0 20px;"></div>
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
                If you didn't request this sign-in link, you can safely ignore this email. This link can only be used once.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px;background-color:#f0f5f2;border-top:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">Secured by Apothecare</p>
                    <p style="margin:0;color:#9ca3af;font-size:10px;">${domain}</p>
                  </td>
                </tr>
              </table>
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

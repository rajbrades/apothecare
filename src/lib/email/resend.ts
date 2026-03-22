import { Resend } from "resend";
import { env } from "@/lib/env";

let _client: Resend | null = null;

export function getResendClient(): Resend {
  if (!_client) {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _client = new Resend(env.RESEND_API_KEY);
  }
  return _client;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id: string }> {
  const client = getResendClient();
  const from = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

  const { data, error } = await client.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error || !data) {
    throw new Error(`Failed to send email: ${error?.message ?? "unknown error"}`);
  }

  return { id: data.id };
}

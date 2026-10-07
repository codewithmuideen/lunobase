import "server-only";
import { Resend } from "resend";
import type { EmailContent } from "./templates";

let resend: Resend | null = null;

function client() {
  if (!process.env.RESEND_API_KEY) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export type EmailAttachment = { filename: string; content: Buffer; contentType?: string };

/** Sends an email. Never throws - email failures must not break trades or logins. */
export async function sendEmail(
  to: string | string[],
  content: EmailContent,
  opts: { attachments?: EmailAttachment[]; replyTo?: string } = {},
): Promise<boolean> {
  const c = client();
  if (!c) {
    console.warn(`[email] RESEND_API_KEY missing - would send "${content.subject}" to ${to}`);
    return false;
  }
  try {
    const { error } = await c.emails.send({
      from: process.env.EMAIL_FROM ?? "Lunobase <no-reply@lunobase.com>",
      replyTo: opts.replyTo ?? process.env.SUPPORT_EMAIL,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
    });
    if (error) {
      console.error("[email] send failed", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send threw", err);
    return false;
  }
}

export async function sendAdminAlert(content: EmailContent) {
  const to = process.env.ADMIN_EMAIL;
  if (to) await sendEmail(to, content);
}

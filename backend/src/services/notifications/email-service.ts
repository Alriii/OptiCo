import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "@/config/env";
import { logger } from "@/lib/logger";
import { EmailOutboxRepository, type EnqueueEmailInput } from "@/repositories/email-outbox-repository";
import { renderEmail } from "@/services/notifications/email-templates";

let transport: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (transport !== undefined) return transport;

  if (!ENV.SMTP_HOST) {
    transport = null;
    return transport;
  }

  transport = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_SECURE,
    auth: ENV.SMTP_USER && ENV.SMTP_PASS ? { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS } : undefined,
  });
  return transport;
}

const outboxRepository = new EmailOutboxRepository();

export async function enqueueEmail(input: EnqueueEmailInput) {
  return outboxRepository.enqueue(input);
}

export async function deliverEmail(templateKey: string, recipient: string, payload: Record<string, unknown>) {
  const mailer = getTransport();
  if (!mailer) {
    logger.info("email_skipped", { templateKey });
    return;
  }

  const rendered = renderEmail(templateKey, payload);
  const fromEmail = ENV.SMTP_FROM_EMAIL ?? "no-reply@localhost";
  await mailer.sendMail({
    from: `"${ENV.SMTP_FROM_NAME}" <${fromEmail}>`,
    to: recipient,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}

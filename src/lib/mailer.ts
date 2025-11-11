import nodemailer from "nodemailer";
import { Resend } from "resend";

import { env } from "./env";
import { logger } from "./logger";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const createDevTransport = () =>
  nodemailer.createTransport({
    host: process.env.MAILHOG_HOST ?? "mailhog",
    port: Number(process.env.MAILHOG_PORT ?? 1025),
  });

export const sendMail = async ({ to, subject, html, text }: EmailPayload) => {
  if (resendClient) {
    await resendClient.emails.send({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    return;
  }

  const transporter = createDevTransport();
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  logger.info("Email dispatched via development transport", { to, subject });
};


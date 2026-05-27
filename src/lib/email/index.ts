// Email abstraction — console (dev) vs Resend (prod).
// Both log to the EmailLog table for an audit trail.

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import * as consoleProvider from "./console";
import * as resendProvider from "./resend";

const provider = env.EMAIL_MODE === "resend" ? resendProvider : consoleProvider;

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailOptions = {
  studentId?: string;
  template: string; // "registration_confirmation" | "selected" | etc.
};

export async function sendEmail(
  payload: EmailPayload,
  opts: SendEmailOptions
) {
  const log = await prisma.emailLog.create({
    data: {
      studentId: opts.studentId ?? null,
      toEmail: payload.to,
      template: opts.template,
      subject: payload.subject,
      status: "QUEUED",
    },
  });

  try {
    const result = await provider.send(payload);
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: "SENT",
        providerId: result.id ?? null,
        sentAt: new Date(),
      },
    });
    return { ok: true as const, id: log.id };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown email error";
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: error },
    });
    return { ok: false as const, error };
  }
}

"use server";

import { requireRole } from "@/lib/auth-user";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function sendTestEmailAction(to: string) {
  await requireRole("SUPER_ADMIN");

  if (!to.includes("@")) {
    return {
      ok: false as const,
      error: "Invalid email address",
      provider: env.EMAIL_MODE,
    };
  }

  // Go through the SAME pipeline students hit — this proves whether the
  // app-level email layer is healthy, not just whether Resend's API works.
  const r = await sendEmail(
    {
      to,
      subject: "EWS Aviation — diagnostic test email",
      html: `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; padding: 24px;">
          <h2 style="color: #1e3a8a; margin: 0 0 12px;">Test email from /admin/email-test</h2>
          <p>If you can read this, the email pipeline is fully operational end-to-end:</p>
          <ul>
            <li>APP_EMAIL_MODE is "resend"</li>
            <li>RESEND_API_KEY is valid</li>
            <li>Sender domain (ews.aero) is verified</li>
            <li>The sendEmail() abstraction works</li>
          </ul>
          <p style="color: #64748b; font-size: 12px;">
            Sent at ${new Date().toISOString()}
          </p>
        </div>
      `,
    },
    { template: "diagnostic_test" }
  );

  if (!r.ok) {
    return {
      ok: false as const,
      error: r.error || "Unknown error",
      provider: env.EMAIL_MODE,
    };
  }
  // Fetch the resolved providerId from the EmailLog row so the UI can
  // distinguish a real Resend id (re_…) from a mock_… console id.
  const logged = await prisma.emailLog.findUnique({
    where: { id: r.id },
    select: { providerId: true },
  });
  return {
    ok: true as const,
    id: logged?.providerId ?? r.id,
    provider: env.EMAIL_MODE,
  };
}

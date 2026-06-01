"use server";

// Direct-apply form action. Public, no auth. Rate-limited per IP.
// On submit, sends a single notification email to aviation@ews.aero
// with the applicant's details. The BCC env var (aviation@ews.aero)
// is already set so the team gets the archive copy automatically.

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { env } from "@/lib/env";

// Roles list is duplicated in src/lib/direct-apply/roles.ts so it can be
// imported by client components. Server actions files can only export
// async functions in Next 16.
import { DIRECT_APPLY_ROLES } from "./roles";

const schema = z.object({
  fullName: z.string().trim().min(2, "Name too short").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  roleInterest: z.enum(DIRECT_APPLY_ROLES),
  experienceYears: z.coerce.number().min(0).max(50).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z
    .boolean()
    .refine((v) => v === true, "Consent required to submit"),
});

type Result =
  | { ok: true; message: string }
  | { ok: false; error: string };

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function submitDirectApplyAction(
  _prev: unknown,
  formData: FormData
): Promise<Result> {
  // Per-IP rate limit so bots can't spam the inbox. 5 per 10 min, 30 min ban.
  const ip = await getClientIp();
  const lim = rateLimit(`direct-apply:${ip}`, 5, 10 * 60_000, 30 * 60_000);
  if (!lim.ok) {
    return {
      ok: false,
      error: `Too many submissions. Please try again in ${Math.ceil(
        lim.retryAfterSec / 60
      )} minutes.`,
    };
  }

  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    raw[k] = v === "on" ? true : v;
  }
  raw.consent =
    raw.consent === true || raw.consent === "true" || raw.consent === "on";

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please fill all required fields",
    };
  }
  const d = parsed.data;

  // Build a structured email for aviation@ews.aero. Plain HTML so the
  // recruiter mailbox can quickly triage.
  const expLine =
    d.experienceYears !== undefined && d.experienceYears !== ""
      ? `<tr><td><strong>Experience:</strong></td><td>${escape(String(d.experienceYears))} years</td></tr>`
      : "";
  const msgLine = d.message
    ? `<tr><td colspan="2" style="padding-top:12px;"><strong>Message:</strong><br><div style="white-space:pre-wrap;margin-top:4px;">${escape(d.message)}</div></td></tr>`
    : "";
  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 640px; padding: 24px; color: #0f172a;">
      <div style="border-left: 4px solid #22c55e; padding-left: 14px; margin-bottom: 18px;">
        <p style="margin: 0; font-size: 11px; letter-spacing: 1.5px; color: #64748b; font-weight: 600;">CAREERS.EWS.AERO</p>
        <h2 style="margin: 4px 0 0; color: #1e3a8a;">Direct Application</h2>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; width: 140px;"><strong>Name:</strong></td><td>${escape(d.fullName)}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email:</strong></td><td><a href="mailto:${escape(d.email)}">${escape(d.email)}</a></td></tr>
        <tr><td style="padding: 6px 0;"><strong>Phone:</strong></td><td><a href="tel:${escape(d.phone)}">${escape(d.phone)}</a></td></tr>
        <tr><td style="padding: 6px 0;"><strong>Role interest:</strong></td><td>${escape(d.roleInterest)}</td></tr>
        ${expLine}
        ${msgLine}
      </table>
      <p style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        Submitted via careers.ews.aero direct-apply form · ${new Date().toISOString()}
      </p>
    </div>
  `;

  // Internal notification email - to the team mailbox. The student doesn't
  // need a copy (we'll reach out manually via the address they provided).
  const r = await sendEmail(
    {
      to: env.EMAIL_REPLY_TO || "aviation@ews.aero",
      subject: `New direct application: ${d.fullName} - ${d.roleInterest}`,
      html,
    },
    { template: "direct_apply_notification" }
  ).catch((e) => ({
    ok: false as const,
    error: e instanceof Error ? e.message : String(e),
  }));

  if (!r.ok) {
    // eslint-disable-next-line no-console
    console.error("[direct-apply] notification email failed:", r);
    // Don't surface SMTP errors to the public; the data may still be in
    // EmailLog (with status=FAILED), and the operator can recover via the
    // audit trail. Show generic friendly message.
    return {
      ok: false,
      error:
        "We received your details but the confirmation email is delayed. Our team will reach out within 48 hours - please also write directly to aviation@ews.aero if urgent.",
    };
  }

  return {
    ok: true,
    message:
      "Thank you. Our recruitment team will review your application and reach out within 48 hours.",
  };
}

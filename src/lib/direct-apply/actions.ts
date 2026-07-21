"use server";

// Direct-apply form action. Public, no auth. Rate-limited per IP.
//
// Two things happen on submit, in this order:
//   1. The applicant + their CV are persisted to the InternAVIA talent pool
//      (separate app, separate database — internavia.ews.aero owns the CV bank).
//   2. A notification email goes to the team mailbox.
//
// Step 1 is the point. This form used to do step 2 only, which meant every
// application became another unread email and the candidate was lost the moment
// the inbox scrolled. The email now exists as a human ping and as the recovery
// path if the API is down — never as the system of record.

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { env } from "@/lib/env";

// Roles list is duplicated in src/lib/direct-apply/roles.ts so it can be
// imported by client components. Server actions files can only export
// async functions in Next 16.
import { DIRECT_APPLY_ROLES } from "./roles";

const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB — must match InternAVIA's cap
const ALLOWED_CV_EXT = ["pdf", "doc", "docx"];

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
  // Which spoke this came from (a role application vs the talent-network sign-up).
  // Validated + defaulted server-side on the InternAVIA ingest, so free-text is fine.
  source: z.string().trim().max(40).optional().or(z.literal("")),
  sourceDetail: z.string().trim().max(120).optional().or(z.literal("")),
});

/** Posts the applicant to the InternAVIA talent pool. Returns null on success,
 *  or a reason string. Never throws — the caller decides what the applicant
 *  sees, and a storage failure must not read as "we didn't get it". */
async function saveToTalentPool(
  d: z.infer<typeof schema>,
  cv: File | null
): Promise<string | null> {
  if (!env.TALENT_INGEST_KEY) return "TALENT_INGEST_KEY not set";

  const fd = new FormData();
  fd.set("fullName", d.fullName);
  fd.set("email", d.email);
  fd.set("phone", d.phone);
  fd.set("roleInterest", d.roleInterest);
  if (d.experienceYears !== undefined && d.experienceYears !== "") {
    fd.set("experienceYears", String(d.experienceYears));
  }
  if (d.message) fd.set("message", d.message);
  fd.set("consent", "true");
  if (d.source) fd.set("source", d.source); // TALENT_NETWORK | CAREERS_FORM (validated on ingest)
  fd.set("sourceDetail", d.sourceDetail || "careers.ews.aero direct-apply");
  if (cv) fd.set("cv", cv, cv.name);

  try {
    const res = await fetch(`${env.TALENT_API_URL}/api/talent/apply`, {
      method: "POST",
      headers: { "x-talent-key": env.TALENT_INGEST_KEY },
      body: fd,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return `talent pool responded ${res.status}: ${body.slice(0, 200)}`;
    }
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

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
    if (k === "cv") continue; // the File is handled separately, not by zod
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

  // CV is optional — a candidate without one is still worth capturing, and the
  // team can chase the file by reply. A bad one, though, we reject up front
  // rather than silently dropping it downstream.
  const rawCv = formData.get("cv");
  let cv: File | null = null;
  if (rawCv && typeof rawCv !== "string" && rawCv.size > 0) {
    const ext = (rawCv.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_CV_EXT.includes(ext)) {
      return { ok: false, error: "CV must be a PDF or Word document (.pdf, .doc, .docx)" };
    }
    if (rawCv.size > MAX_CV_BYTES) {
      return { ok: false, error: "CV is too large — please keep it under 5 MB." };
    }
    cv = rawCv;
  }

  // The write that matters. Do it before the email so the notification can tell
  // the team whether the candidate is actually in the database.
  const saveError = await saveToTalentPool(d, cv);
  if (saveError) {
    console.error("[direct-apply] talent pool write failed:", saveError);
  }

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
        <tr><td style="padding: 6px 0;"><strong>CV:</strong></td><td>${
          cv ? `${escape(cv.name)} (${Math.round(cv.size / 1024)} KB)` : "Not attached — chase by reply"
        }</td></tr>
        ${msgLine}
      </table>
      ${
        saveError
          ? `<p style="margin-top:16px;padding:12px;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;font-size:13px;color:#991b1b;">
               <strong>⚠️ Not saved to the talent pool.</strong> This email is the only copy — act on it.
               Reason: ${escape(saveError)}
             </p>`
          : `<p style="margin-top:16px;font-size:13px;color:#166534;">
               ✅ Saved to the talent pool —
               <a href="https://internavia.ews.aero/admin/v2/talent">open in admin</a>. No action needed here.
             </p>`
      }
      <p style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        Submitted via careers.ews.aero direct-apply form · ${new Date().toISOString()}
      </p>
    </div>
  `;

  // Internal notification email - to the team mailbox. A heads-up, not the
  // record: the talent pool above is the record. The applicant doesn't need a
  // copy (we'll reach out via the address they provided).
  const r = await sendEmail(
    {
      to: env.EMAIL_REPLY_TO || "aviation@ews.aero",
      subject: saveError
        ? `⚠️ UNSAVED direct application: ${d.fullName} - ${d.roleInterest}`
        : `New direct application: ${d.fullName} - ${d.roleInterest}`,
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
  }

  // The applicant only sees a failure if BOTH paths failed — if we hold their
  // details in either the database or the mailbox, we have their application
  // and telling them otherwise would just make them submit again.
  if (saveError && !r.ok) {
    return {
      ok: false,
      error:
        "Something went wrong at our end and we could not record your application. Please email your CV directly to aviation@ews.aero and we'll pick it up from there.",
    };
  }

  return {
    ok: true,
    message:
      "Thank you. Our recruitment team will review your application and reach out within 48 hours.",
  };
}

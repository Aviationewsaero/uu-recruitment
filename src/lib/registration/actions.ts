"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtp as authSendOtp, verifyOtp as authVerifyOtp } from "@/lib/auth";
import { uploadFile, UPLOAD_LIMITS, getFileUrl } from "@/lib/storage";
import { sendEmail } from "@/lib/email";
import { registrationConfirmation } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  registrationFormSchema,
  emailSchema,
  otpSchema,
  type RegistrationFormValues,
} from "./schema";

// ----- OTP actions -----

export async function requestOtpAction(_prev: unknown, formData: FormData) {
  try {
    const parsed = emailSchema.safeParse({ email: formData.get("email") });
    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid email",
      };
    }
    const email = parsed.data.email;

    // C2: rate-limit registration start by IP — prevents a single host
    // from enumerating which emails are already registered and from
    // exhausting Supabase OTP budget.
    const ip = await getClientIp();
    const lim = rateLimit(`register:ip:${ip}`, 20, 10 * 60_000, 30 * 60_000);
    if (!lim.ok) {
      return {
        ok: false as const,
        error: `Too many requests — try again in ${Math.ceil(
          lim.retryAfterSec / 60
        )} min.`,
      };
    }

    // Reject duplicate registration up front — same check in both auth modes
    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      const tok = await prisma.token.findUnique({
        where: { studentId: existing.id },
      });
      return {
        ok: false as const,
        error: `This email is already registered (token #${tok?.tokenNumber ?? "—"}). Use a different email or visit the desk.`,
      };
    }

    // BYPASS: when STUDENT_AUTH=none, skip OTP entirely and let the flow
    // jump straight to the form. Email is locked at this point.
    if (env.STUDENT_AUTH === "none") {
      return { ok: true as const, email, bypassed: true };
    }

    const result = await authSendOtp(email);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, email, bypassed: false };
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    // eslint-disable-next-line no-console
    console.error("[requestOtpAction] failure:", msg, e);
    return {
      ok: false as const,
      error: `Server error — please try again. (${msg.slice(0, 120)})`,
    };
  }
}

export async function verifyOtpAction(_prev: unknown, formData: FormData) {
  try {
    const parsed = otpSchema.safeParse({
      email: formData.get("email"),
      code: formData.get("code"),
    });
    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }
    const result = await authVerifyOtp(parsed.data.email, parsed.data.code);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, email: result.verifiedEmail };
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    // eslint-disable-next-line no-console
    console.error("[verifyOtpAction] failure:", msg, e);
    return {
      ok: false as const,
      error: `Server error — please try again. (${msg.slice(0, 120)})`,
    };
  }
}

// ----- Registration submit -----

export type SubmitResult =
  | {
      ok: true;
      registrationId: string;
      tokenNumber: number;
      admitCardToken: string;
    }
  | { ok: false; error: string };

export async function submitRegistrationAction(
  email: string,
  formData: FormData
): Promise<SubmitResult> {
  try {
    return await submitRegistrationInner(email, formData);
  } catch (e) {
    // H6: never leak server-side error text to the client. Full detail
    // still lands in server logs (Vercel) for debugging.
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    // eslint-disable-next-line no-console
    console.error("[submitRegistrationAction] fatal:", msg, e);
    return {
      ok: false,
      error: "Submission failed — please try again or contact the desk.",
    };
  }
}

async function submitRegistrationInner(
  email: string,
  formData: FormData
): Promise<SubmitResult> {
  // C2: hard cap on submissions per IP. A single workstation should not
  // submit more than ~5 in a 10-minute window in real-world use.
  const ip = await getClientIp();
  const lim = rateLimit(`register-submit:ip:${ip}`, 5, 10 * 60_000, 15 * 60_000);
  if (!lim.ok) {
    return {
      ok: false,
      error: `Too many submissions — wait ${Math.ceil(
        lim.retryAfterSec / 60
      )} min before trying again.`,
    };
  }

  // 1. Validate text fields
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k === "resume" || k === "photo") continue;
    raw[k] = v === "on" ? true : v;
  }
  // boolean coercion for consent checkbox (FormData stringifies booleans)
  raw.consentGiven =
    raw.consentGiven === true ||
    raw.consentGiven === "true" ||
    raw.consentGiven === "on";

  const parsed = registrationFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }
  const data: RegistrationFormValues = parsed.data;

  // 2. Validate files
  const resume = formData.get("resume") as File | null;
  const photo = formData.get("photo") as File | null;
  if (!resume || resume.size === 0)
    return { ok: false, error: "Resume is required" };
  if (!photo || photo.size === 0)
    return { ok: false, error: "Photo is required" };
  if (resume.size > UPLOAD_LIMITS.resume.maxBytes)
    return { ok: false, error: "Resume exceeds 5MB" };
  if (photo.size > UPLOAD_LIMITS.photo.maxBytes)
    return {
      ok: false,
      error: `Photo too large (${(photo.size / 1024 / 1024).toFixed(1)} MB). Try a smaller image or use Gallery instead of Camera.`,
    };
  if (!UPLOAD_LIMITS.resume.mimeTypes.includes(resume.type as never))
    return { ok: false, error: "Resume must be PDF or DOCX" };
  if (!UPLOAD_LIMITS.photo.mimeTypes.includes(photo.type as never))
    return {
      ok: false,
      error: `Photo format not supported (${photo.type || "unknown"}). Please pick a JPG or PNG from your gallery.`,
    };

  // 3. Race-check email uniqueness one more time
  if (await prisma.student.findUnique({ where: { email } })) {
    return { ok: false, error: "This email is already registered" };
  }

  // 4. Transaction: create student, allocate token, build registration ID
  let tokenNumber = 0;
  let registrationId = "";
  let studentId = "";
  // Per-student secret for the admit-card download URL — hoisted out of
  // the txn so we can return it to the client for the success-page gate.
  const admitCardToken = crypto.randomBytes(16).toString("base64url");

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (txRaw: any) => {
      const tx = txRaw as typeof prisma;
      const student = await tx.student.create({
        data: {
          registrationId: `PENDING-${Date.now()}`, // placeholder, updated below
          fullName: data.fullName,
          fatherName: data.fatherName || null,
          motherName: data.motherName || null,
          phone: data.phone,
          email,
          gender: data.gender,
          address: data.address || null,
          course:
            data.course === "Other (specify)"
              ? (data.customCourse || "Other")
              : data.course,
          customCourse:
            data.course === "Other (specify)" ? (data.customCourse || null) : null,
          semester: data.semester,
          specialization: data.specialization || null,
          tenthPercent: data.tenthPercent,
          twelfthPercent: data.twelfthPercent,
          tenthState: data.tenthState || "—",
          twelfthState: data.twelfthState || "—",
          graduationCgpa: (data.graduationCgpa as number) || null,
          consentGiven: data.consentGiven,
          admitCardToken,
        },
      });
      studentId = student.id as string;

      const token = await tx.token.create({
        data: { studentId: studentId },
      });
      tokenNumber = token.tokenNumber as number;
      registrationId = `UU-AV-2026-${tokenNumber.toString().padStart(4, "0")}`;

      await tx.student.update({
        where: { id: studentId },
        data: { registrationId },
      });
    });
  } catch (e) {
    // H6: log full detail, return generic.
    // eslint-disable-next-line no-console
    console.error("[submitRegistration] db txn failed:", e);
    return { ok: false, error: "Failed to save registration — please retry." };
  }

  // 5. Upload files (outside txn — large files shouldn't hold a DB connection).
  // Perf #1: fire both uploads in parallel + read buffers in parallel.
  // Was sequential: read resume → read photo → upload resume → upload photo
  // (4 sequential awaits, ~2-4s total). Now: ~half that.
  const resumeExt = resume.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const photoExt = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";

  const [resumeBuf, photoBuf] = await Promise.all([
    resume.arrayBuffer().then((b) => Buffer.from(b)),
    photo.arrayBuffer().then((b) => Buffer.from(b)),
  ]);

  const [resumeUp, photoUp] = await Promise.all([
    uploadFile("student-documents", `resumes/${registrationId}.${resumeExt}`, {
      buffer: resumeBuf,
      mimeType: resume.type,
    }),
    uploadFile("student-documents", `photos/${registrationId}.${photoExt}`, {
      buffer: photoBuf,
      mimeType: photo.type,
    }),
  ]);

  if (resumeUp.ok && photoUp.ok) {
    await prisma.student.update({
      where: { id: studentId },
      data: { resumeUrl: resumeUp.path, passportPhoto: photoUp.path },
    });
  }

  // Build the admit-card URL we'll email (and embed in the success page).
  const admitCardUrl =
    `${env.APP_URL}/api/admit-card/${registrationId}?t=${admitCardToken}`;

  // 6 + 7: confirmation email + audit log + cache revalidation all run
  // AFTER the response is sent to the student. They get their token
  // immediately; the slow side effects don't block the redirect.
  after(async () => {
    try {
      const tmpl = registrationConfirmation({
        fullName: data.fullName,
        registrationId,
        tokenNumber,
        admitCardUrl,
      });
      const emailResult = await sendEmail(
        { to: email, subject: tmpl.subject, html: tmpl.html },
        { studentId, template: "registration_confirmation" }
      ).catch((e) => ({
        ok: false as const,
        error: e instanceof Error ? e.message : String(e),
      }));
      if (!emailResult.ok) {
        // eslint-disable-next-line no-console
        console.error("[submitRegistration] confirmation email failed:", {
          studentId,
          registrationId,
          email,
          error: "error" in emailResult ? emailResult.error : "unknown",
        });
      }

      await prisma.auditLog.create({
        data: {
          action: "student.register",
          target: studentId,
          payload: { registrationId, tokenNumber, email },
        },
      });

      revalidatePath("/admin");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[submitRegistration] after-hook failure:", e);
    }
  });

  return { ok: true, registrationId, tokenNumber, admitCardToken };
}

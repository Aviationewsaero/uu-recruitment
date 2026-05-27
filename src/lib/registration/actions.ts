"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendOtp as authSendOtp, verifyOtp as authVerifyOtp } from "@/lib/auth";
import { uploadFile, UPLOAD_LIMITS, getFileUrl } from "@/lib/storage";
import { sendEmail } from "@/lib/email";
import { registrationConfirmation } from "@/lib/email/templates";
import { env } from "@/lib/env";
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

    // Reject duplicate registration BEFORE OTP burn
    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      const tok = await prisma.token.findUnique({
        where: { studentId: existing.id },
      });
      return {
        ok: false as const,
        error: `This email is already registered (token #${tok?.tokenNumber ?? "—"}). Use a different email or contact the desk.`,
      };
    }

    const result = await authSendOtp(email);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, email };
  } catch (e) {
    // Surface actual error to logs (and user) so we can debug prod issues
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    // eslint-disable-next-line no-console
    console.error("[requestOtpAction] failure:", msg, e);
    return {
      ok: false as const,
      error: `Server error — please try again in a moment. (${msg.slice(0, 120)})`,
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
  | { ok: true; registrationId: string; tokenNumber: number }
  | { ok: false; error: string };

export async function submitRegistrationAction(
  email: string,
  formData: FormData
): Promise<SubmitResult> {
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
    return { ok: false, error: "Photo exceeds 2MB" };
  if (!UPLOAD_LIMITS.resume.mimeTypes.includes(resume.type as never))
    return { ok: false, error: "Resume must be PDF or DOCX" };
  if (!UPLOAD_LIMITS.photo.mimeTypes.includes(photo.type as never))
    return { ok: false, error: "Photo must be JPEG, PNG, or WebP" };

  // 3. Race-check email uniqueness one more time
  if (await prisma.student.findUnique({ where: { email } })) {
    return { ok: false, error: "This email is already registered" };
  }

  // 4. Transaction: create student, allocate token, build registration ID
  let tokenNumber = 0;
  let registrationId = "";
  let studentId = "";

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (txRaw: any) => {
      const tx = txRaw as typeof prisma;
      const student = await tx.student.create({
        data: {
          registrationId: `PENDING-${Date.now()}`, // placeholder, updated below
          fullName: data.fullName,
          fatherName: data.fatherName,
          motherName: data.motherName,
          phone: data.phone,
          email,
          gender: data.gender,
          address: data.address,
          course:
            data.course === "Other (specify)"
              ? (data.customCourse ?? "Other")
              : data.course,
          customCourse:
            data.course === "Other (specify)" ? data.customCourse : null,
          semester: data.semester,
          specialization: data.specialization ?? null,
          tenthPercent: data.tenthPercent,
          twelfthPercent: data.twelfthPercent,
          tenthState: data.tenthState,
          twelfthState: data.twelfthState,
          graduationCgpa: data.graduationCgpa ?? null,
          consentGiven: data.consentGiven,
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
    return {
      ok: false,
      error:
        e instanceof Error
          ? `Database error: ${e.message}`
          : "Failed to save registration",
    };
  }

  // 5. Upload files (outside txn — large files shouldn't hold a DB connection)
  const resumeBuf = Buffer.from(await resume.arrayBuffer());
  const photoBuf = Buffer.from(await photo.arrayBuffer());
  const resumeExt = resume.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const photoExt = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";

  const resumeUp = await uploadFile("student-documents", `resumes/${registrationId}.${resumeExt}`, {
    buffer: resumeBuf,
    mimeType: resume.type,
  });
  const photoUp = await uploadFile("student-documents", `photos/${registrationId}.${photoExt}`, {
    buffer: photoBuf,
    mimeType: photo.type,
  });

  if (resumeUp.ok && photoUp.ok) {
    await prisma.student.update({
      where: { id: studentId },
      data: { resumeUrl: resumeUp.path, passportPhoto: photoUp.path },
    });
  }

  // 6. Confirmation email — log failures, never silent.
  // Don't roll back the registration if email fails — student has their token.
  const admitCardUrl = `${env.APP_URL}/api/admit-card/${registrationId}`;
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

  // 7. Audit log
  await prisma.auditLog.create({
    data: {
      action: "student.register",
      target: studentId,
      payload: { registrationId, tokenNumber, email },
    },
  });

  revalidatePath("/admin");
  return { ok: true, registrationId, tokenNumber };
}

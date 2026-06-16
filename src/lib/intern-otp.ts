// Email-OTP helpers for the intern signup flow.
//
// Design:
//   - 6-digit numeric codes (matches the staff student-registration flow).
//   - Codes are bcrypt-hashed in the DB; the plaintext only lives in the
//     outbound email and the user's browser tab.
//   - 10-minute expiry, 5-attempt limit per OTP row.
//   - Generating a new OTP invalidates prior unconsumed ones for that
//     (intern, purpose) pair, so resending always works cleanly.

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

export type OtpPurpose = "signup_verify" | "password_reset";

/**
 * Generate a fresh OTP code, write its hash to InternOtp, invalidate older
 * unconsumed codes for the same (intern, purpose). Returns the plaintext
 * code so the caller can email it.
 */
export async function issueInternOtp(
  internId: string,
  purpose: OtpPurpose
): Promise<{ code: string; expiresAt: Date }> {
  // Use crypto.randomInt — uniform distribution, no modulo bias.
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  // Single-statement: invalidate prior unconsumed codes, then insert.
  // Doing this in a transaction so a concurrent resend can't race.
  await prisma.$transaction([
    prisma.internOtp.updateMany({
      where: { internId, purpose, consumedAt: null },
      data: { consumedAt: new Date(0) }, // sentinel "invalidated" timestamp
    }),
    prisma.internOtp.create({
      data: { internId, purpose, codeHash, expiresAt },
    }),
  ]);

  return { code, expiresAt };
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "wrong_code" };

/**
 * Verify a plaintext code against the most-recent unconsumed OTP for the
 * given (intern, purpose). Increments attempts on wrong-code; consumes the
 * row on success.
 */
export async function verifyInternOtp(
  internId: string,
  purpose: OtpPurpose,
  code: string
): Promise<OtpVerifyResult> {
  const trimmed = String(code).replace(/\D/g, "").slice(0, 6);
  if (trimmed.length !== 6) return { ok: false, reason: "wrong_code" };

  const otp = await prisma.internOtp.findFirst({
    where: { internId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false, reason: "not_found" };
  if (otp.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const matches = await bcrypt.compare(trimmed, otp.codeHash);
  if (!matches) {
    await prisma.internOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "wrong_code" };
  }

  await prisma.internOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}

export type OtpFailReason = "not_found" | "expired" | "too_many_attempts" | "wrong_code";

/** Human-readable reason for end-user display. */
export function otpReasonMessage(reason: OtpFailReason): string {
  switch (reason) {
    case "not_found":
      return "No active code on file. Click 'Resend code' to get a new one.";
    case "expired":
      return "That code expired. Click 'Resend code' to get a new one.";
    case "too_many_attempts":
      return "Too many wrong tries. Click 'Resend code' to get a new one.";
    case "wrong_code":
      return "That code is incorrect. Please check your email and try again.";
  }
}

"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendOtp, verifyOtp } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";

// ─── PRIMARY: Email + password login (for ALL staff roles) ───────────────────

export async function adminPasswordLoginAction(
  _prev: unknown,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) {
    return { ok: false as const, error: "Email and password required" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Single error message for invalid email, missing password, inactive user — avoids enumeration
  const reject = () =>
    ({ ok: false as const, error: "Invalid email or password" }) as const;

  if (!user || !user.active) return reject();

  // First try the DB-stored bcrypt password
  if (user.passwordHash) {
    const ok = await verifyPassword(password, user.passwordHash);
    if (ok) return await loginSuccess(user.id as string, user.email, user.role);
  }

  // Fall back to break-glass env password for super admin (legacy path,
  // kept so the system stays accessible if the bcrypt hash gets corrupted)
  const expectedEmail = (process.env.ADMIN_EMERGENCY_EMAIL ?? "")
    .trim()
    .toLowerCase();
  const expectedPassword = process.env.ADMIN_EMERGENCY_PASSWORD ?? "";
  if (
    expectedEmail &&
    expectedPassword.length >= 12 &&
    constantTimeEqual(email, expectedEmail) &&
    constantTimeEqual(password, expectedPassword) &&
    user.role === "SUPER_ADMIN"
  ) {
    return await loginSuccess(
      user.id as string,
      user.email,
      user.role,
      "auth.emergency_password_login"
    );
  }

  return reject();
}

// ─── LEGACY: Email + OTP login (still works for staff with no password set,
// and remains available as a fallback path if SMTP is restored) ─────────────

export async function adminRequestOtpAction(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false as const, error: "Enter a valid email" };
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return {
      ok: false as const,
      error: "No staff account found for that email. Contact your admin to be added.",
    };
  }
  const result = await sendOtp(email);
  if (!result.ok) return { ok: false as const, error: result.error };
  return { ok: true as const, email };
}

export async function adminVerifyOtpAction(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const code = (formData.get("code") as string)?.trim();
  if (!email || !code) return { ok: false as const, error: "Missing fields" };

  const v = await verifyOtp(email, code);
  if (!v.ok) return { ok: false as const, error: v.error };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return { ok: false as const, error: "Account not found or inactive" };
  }
  return await loginSuccess(user.id as string, user.email, user.role);
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

async function loginSuccess(
  userId: string,
  email: string,
  role: "SUPER_ADMIN" | "RECRUITER" | "DESK_OPERATOR" | "EMAIL_MANAGER",
  auditAction = "auth.login"
) {
  await setSessionCookie({ userId, email, role });
  await prisma.auditLog
    .create({
      data: { actorId: userId, action: auditAction, target: userId },
    })
    .catch(() => undefined);
  return { ok: true as const, role };
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}

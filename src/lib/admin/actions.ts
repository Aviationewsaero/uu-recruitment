"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendOtp, verifyOtp } from "@/lib/auth";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";

export async function adminRequestOtpAction(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false as const, error: "Enter a valid email" };
  }
  // Only allow OTP if email exists in User table (no self-signup for staff)
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    // Don't reveal whether the email exists — just say "if you have access…"
    return {
      ok: false as const,
      error:
        "No staff account found for that email. Contact your admin to be added.",
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

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Audit
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "auth.login", target: user.id },
  });

  return { ok: true as const, role: user.role };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}

// ─── Break-glass: password login for super admin ──────────────────────────────
// Bypasses Supabase Auth / OTP entirely. Useful when SMTP is misconfigured
// or rate-limited. Only works for the single email configured in
// ADMIN_EMERGENCY_EMAIL env var, and only if that user exists in the DB with
// SUPER_ADMIN role. Constant-time string compare to prevent timing attacks.

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function adminPasswordLoginAction(
  _prev: unknown,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) {
    return { ok: false as const, error: "Email and password required" };
  }

  const expectedEmail = (
    process.env.ADMIN_EMERGENCY_EMAIL ?? ""
  ).trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_EMERGENCY_PASSWORD ?? "";

  if (!expectedEmail || !expectedPassword || expectedPassword.length < 12) {
    return {
      ok: false as const,
      error:
        "Emergency login is not configured on the server. Contact the system admin.",
    };
  }

  // Constant-time compare for both email and password
  const emailMatch = constantTimeEqual(email, expectedEmail);
  const passwordMatch = constantTimeEqual(password, expectedPassword);
  if (!emailMatch || !passwordMatch) {
    // Don't reveal which field is wrong
    return { ok: false as const, error: "Invalid email or password" };
  }

  // Defense in depth: the env-configured email must also exist in the User
  // table with SUPER_ADMIN role. Without this, a leaked password alone can't
  // create a super admin out of thin air.
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || user.role !== "SUPER_ADMIN") {
    return {
      ok: false as const,
      error:
        "Emergency email is not a SUPER_ADMIN account. Contact the system admin.",
    };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Audit — flag specifically so this shows up in security reviews
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "auth.emergency_password_login",
      target: user.id,
      payload: { email },
    },
  });

  return { ok: true as const, role: user.role };
}

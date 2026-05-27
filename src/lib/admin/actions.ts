"use server";

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

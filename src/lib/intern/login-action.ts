"use server";

import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function loginInternAction(email: string, password: string) {
  // NOTE: redirect() throws a NEXT_REDIRECT error internally. It MUST be called
  // outside any try/catch or the catch will swallow it and the redirect silently
  // fails. We gate on this flag after the try block instead.
  let shouldRedirect = false;

  try {
    const intern = await prisma.intern.findUnique({
      where: { personalEmail: email },
      include: { period: true },
    });

    if (!intern) {
      return { success: false, error: "Invalid email or password" };
    }

    if (intern.status === "INACTIVE") {
      return { success: false, error: "Your account has been disabled. Contact your mentor." };
    }

    if (intern.status === "TERMINATED") {
      return { success: false, error: "Your access has been terminated. Contact your mentor." };
    }

    if (intern.status === "PENDING_VERIFICATION") {
      return {
        success: false,
        error: "Your account is awaiting admin approval. You'll receive an email when approved.",
      };
    }

    if (intern.status === "COMPLETED") {
      return { success: false, error: "Your internship period has ended." };
    }

    // Check internship period end date
    if (intern.period && intern.period.endDate < new Date()) {
      return { success: false, error: "Your internship period has ended." };
    }

    // Guard against placeholder empty hash left by OTP step
    if (!intern.passwordHash) {
      return { success: false, error: "Account setup incomplete. Please contact admin." };
    }

    const isPasswordValid = await compare(password, intern.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" };
    }

    const { setInternSessionCookie } = await import("@/lib/intern-session");
    await setInternSessionCookie({
      internId: intern.id,
      email: intern.personalEmail,
    });

    await prisma.intern.update({
      where: { id: intern.id },
      data: { lastLoginAt: new Date() },
    });

    shouldRedirect = true;
  } catch (err) {
    console.error("Login error:", err instanceof Error ? err.message : err);
    return { success: false, error: "An error occurred. Please try again." };
  }

  // redirect() must live outside try/catch — Next.js uses throw internally
  if (shouldRedirect) redirect("/intern/dashboard");

  // TypeScript: redirect() always throws but TS doesn't model that.
  // This line is unreachable; it only exists to satisfy the return type.
  return { success: false, error: "" };
}

"use server";

import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function loginInternAction(email: string, password: string) {
  try {
    // Find intern by email
    const intern = await prisma.intern.findUnique({
      where: { personalEmail: email },
      include: { period: true },
    });

    if (!intern) {
      return { success: false, error: "Invalid email or password" };
    }

    // Check status before password (fail fast on disabled accounts)
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

    // Check internship period window
    if (intern.period) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Get period from DB since we didn't include it
      const period = await prisma.internshipPeriod.findUnique({
        where: { internId: intern.id },
      });
      if (period && period.endDate < today) {
        return { success: false, error: "Your internship period has ended." };
      }
    }

    // Verify password
    const isPasswordValid = await compare(password, intern.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" };
    }

    // Set session cookie (lazy load to avoid module loading in client context)
    const { setInternSessionCookie } = await import("@/lib/intern-session");
    await setInternSessionCookie({
      internId: intern.id,
      email: intern.personalEmail,
    });

    // Update last login
    await prisma.intern.update({
      where: { id: intern.id },
      data: { lastLoginAt: new Date() },
    });

    // Redirect to dashboard
    redirect("/intern/dashboard");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    console.error("Login error:", message);
    return { success: false, error: "An error occurred. Please try again." };
  }
}

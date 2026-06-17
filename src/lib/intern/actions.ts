"use server";

// IMPORTANT: Server actions must NEVER call fetch() to their own API routes.
// On Vercel, the serverless function cannot reach localhost, so all three steps
// (request-otp, verify-otp, submit-signup) are implemented here with direct
// Prisma + Resend calls — no HTTP round-trips.

import { hash, compare } from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import type { InternSignupFormValues } from "./schema";

// ── Request OTP ──────────────────────────────────────────────────────────────

export async function requestInternOtpAction(email: string) {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Invalid email address" };
    }

    // Block re-signup for already active/completed interns
    const existingActive = await prisma.intern.findFirst({
      where: { personalEmail: email, NOT: { status: "PENDING_VERIFICATION" } },
    });
    if (existingActive) {
      return { success: false, error: "Email already registered" };
    }

    const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
    const otpHash = await hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const pendingIntern = await prisma.intern.findFirst({
      where: { personalEmail: email, status: "PENDING_VERIFICATION" },
      include: { otps: true },
    });

    if (pendingIntern) {
      await prisma.internOtp.deleteMany({ where: { internId: pendingIntern.id } });
      await prisma.internOtp.create({
        data: { internId: pendingIntern.id, codeHash: otpHash, purpose: "signup_verify", expiresAt },
      });
    } else {
      const year = new Date().getFullYear();
      const count = await prisma.intern.count({
        where: { createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
      });
      const tempInternId = `EWS-INT-${year}-${String(count + 1).padStart(4, "0")}`;
      const tempIntern = await prisma.intern.create({
        data: {
          internId: tempInternId,
          personalEmail: email,
          fullName: email,
          phone: "",
          gender: "PREFER_NOT_TO_SAY",
          department: "OTHER",
          passwordHash: "",
          status: "PENDING_VERIFICATION",
        },
      });
      await prisma.internOtp.create({
        data: { internId: tempIntern.id, codeHash: otpHash, purpose: "signup_verify", expiresAt },
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "noreply@ews.aero",
      to: email,
      subject: "Your Elite World Services Internship Portal – Verification Code",
      html: `<h2>Email Verification</h2>
<p>Your one-time verification code is:</p>
<h1 style="font-size:36px;font-weight:bold;letter-spacing:4px;color:#1e3a8a">${otp}</h1>
<p>This code expires in <strong>10 minutes</strong>.</p>
<p style="color:#666">If you didn't request this, ignore this email.</p>`,
    });

    return { success: true };
  } catch (err) {
    console.error("requestInternOtpAction:", err);
    return { success: false, error: "Failed to send OTP. Please try again." };
  }
}

// ── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyInternOtpAction(email: string, otp: string) {
  try {
    if (!email || !otp) {
      return { success: false, error: "Email and OTP are required" };
    }

    const intern = await prisma.intern.findFirst({
      where: { personalEmail: email, status: "PENDING_VERIFICATION" },
      include: {
        otps: {
          where: { purpose: "signup_verify" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!intern || intern.otps.length === 0) {
      return { success: false, error: "No OTP found. Please request a new code." };
    }

    const otpRecord = intern.otps[0];

    if (new Date() > otpRecord.expiresAt) {
      return { success: false, error: "OTP has expired. Please request a new code." };
    }

    if (otpRecord.attempts >= 5) {
      return { success: false, error: "Too many attempts. Please request a new code." };
    }

    const isValid = await compare(otp, otpRecord.codeHash);
    if (!isValid) {
      await prisma.internOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      const remaining = 4 - otpRecord.attempts;
      return {
        success: false,
        error: `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      };
    }

    await Promise.all([
      prisma.internOtp.update({ where: { id: otpRecord.id }, data: { consumedAt: new Date() } }),
      prisma.intern.update({ where: { id: intern.id }, data: { emailVerifiedAt: new Date() } }),
    ]);

    return { success: true };
  } catch (err) {
    console.error("verifyInternOtpAction:", err);
    return { success: false, error: "Failed to verify OTP. Please try again." };
  }
}

// ── Submit Full Signup ────────────────────────────────────────────────────────

export async function submitInternSignupAction(data: InternSignupFormValues) {
  try {
    if (!data.email || !data.password || !data.fullName || !data.phone) {
      return { success: false, error: "Missing required fields" };
    }
    if (data.password !== data.confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    const existingActive = await prisma.intern.findFirst({
      where: { personalEmail: data.email, NOT: { status: "PENDING_VERIFICATION" } },
    });
    if (existingActive) {
      return { success: false, error: "Email already registered" };
    }

    const passwordHash = await hash(data.password, 10);
    const pendingIntern = await prisma.intern.findFirst({
      where: { personalEmail: data.email, status: "PENDING_VERIFICATION" },
    });

    let intern;
    const commonFields = {
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      bloodGroup: data.bloodGroup || undefined,
      phone: data.phone,
      alternatePhone: data.alternatePhone || undefined,
      parentContact: data.parentContact || undefined,
      currentAddress: data.currentAddress || undefined,
      permanentAddress: data.permanentAddress || undefined,
      department: data.department,
      enrollmentNumber: data.enrollmentNumber || undefined,
      batchYear: data.batchYear || undefined,
      currentSemester: data.currentSemester || undefined,
      expectedGraduation: data.expectedGraduation || undefined,
      universityMentor: data.universityMentor || undefined,
      class10Board: data.class10Board || undefined,
      class10Year: data.class10Year || undefined,
      class10Percent: data.class10Percent || undefined,
      class12Board: data.class12Board || undefined,
      class12Stream: data.class12Stream || undefined,
      class12Year: data.class12Year || undefined,
      class12Percent: data.class12Percent || undefined,
      ugCourse: data.ugCourse || undefined,
      currentCgpa: data.currentCgpa || undefined,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactRelation: data.emergencyContactRelation || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
      skillsAssessment: data.skillsAssessment || undefined,
      passwordHash,
      consentGiven: data.consentGiven,
      status: "PENDING_VERIFICATION" as const,
    };

    if (pendingIntern) {
      intern = await prisma.intern.update({ where: { id: pendingIntern.id }, data: commonFields });
    } else {
      const year = new Date().getFullYear();
      const count = await prisma.intern.count({
        where: { createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
      });
      intern = await prisma.intern.create({
        data: {
          internId: `EWS-INT-${year}-${String(count + 1).padStart(4, "0")}`,
          personalEmail: data.email,
          emailVerifiedAt: new Date(),
          ...commonFields,
        },
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "noreply@ews.aero",
      to: data.email,
      subject: "Welcome to Elite World Services Internship Portal",
      html: `<h2>Welcome, ${data.fullName}!</h2>
<p>Your internship portal account has been created successfully.</p>
<p><strong>Your Intern ID:</strong> ${intern.internId}</p>
<p>An admin will review and activate your account shortly. You'll receive an email once approved.</p>
<p><a href="https://careers.ews.aero/intern/login">Login at careers.ews.aero/intern/login</a></p>`,
    });

    return { success: true, internId: intern.internId };
  } catch (err) {
    console.error("submitInternSignupAction:", err);
    return { success: false, error: "Signup failed. Please try again." };
  }
}

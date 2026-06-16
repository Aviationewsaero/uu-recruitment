import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if intern already exists
    const existingIntern = await prisma.intern.findUnique({
      where: { personalEmail: email },
    });

    if (existingIntern) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up any expired OTPs for this email first
    // (Find any intern record pending verification with this email, delete old OTPs)
    const pendingIntern = await prisma.intern.findFirst({
      where: {
        personalEmail: email,
        status: "PENDING_VERIFICATION",
      },
      include: { otps: true },
    });

    if (pendingIntern) {
      // Delete old OTPs
      if (pendingIntern.otps.length > 0) {
        await prisma.internOtp.deleteMany({
          where: { id: { in: pendingIntern.otps.map((o) => o.id) } },
        });
      }

      // Create new OTP for existing pending intern
      await prisma.internOtp.create({
        data: {
          internId: pendingIntern.id,
          codeHash: otpHash,
          purpose: "signup_verify",
          expiresAt,
        },
      });
    } else {
      // Generate temp internId
      const year = new Date().getFullYear();
      const count = await prisma.intern.count({
        where: {
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
        },
      });
      const tempInternId = `EWS-INT-${year}-${String(count + 1).padStart(4, "0")}`;

      // Create temporary pending intern record (will be updated on signup)
      const tempIntern = await prisma.intern.create({
        data: {
          internId: tempInternId,
          personalEmail: email,
          fullName: email, // placeholder, updated on signup
          phone: "", // placeholder
          gender: "PREFER_NOT_TO_SAY", // placeholder
          department: "OTHER", // placeholder
          passwordHash: "", // placeholder, will be set on signup
          status: "PENDING_VERIFICATION",
        },
      });

      // Create OTP for this temp intern
      await prisma.internOtp.create({
        data: {
          internId: tempIntern.id,
          codeHash: otpHash,
          purpose: "signup_verify",
          expiresAt,
        },
      });
    }

    // Send OTP via email
    await resend.emails.send({
      from: "noreply@uu-recruitment.ews.aero",
      to: email,
      subject: "Your UU Aviation Internship Portal - Verification Code",
      html: `
        <h2>Email Verification</h2>
        <p>Your one-time verification code is:</p>
        <h1 style="font-size: 32px; font-weight: bold; letter-spacing: 2px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OTP request error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

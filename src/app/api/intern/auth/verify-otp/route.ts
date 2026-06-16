import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP required" },
        { status: 400 }
      );
    }

    // Find intern with pending verification
    const intern = await prisma.intern.findFirst({
      where: {
        personalEmail: email,
        status: "PENDING_VERIFICATION",
      },
      include: {
        otps: {
          where: { purpose: "signup_verify" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!intern || intern.otps.length === 0) {
      return NextResponse.json({ error: "OTP not found" }, { status: 404 });
    }

    const otpRecord = intern.otps[0];

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // Check attempt limit (max 5 attempts)
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many attempts. Request a new OTP." },
        { status: 429 }
      );
    }

    // Verify OTP
    const isValid = await compare(otp, otpRecord.codeHash);
    if (!isValid) {
      // Increment attempt counter
      await prisma.internOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Mark OTP as consumed
    await prisma.internOtp.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() },
    });

    // Set emailVerifiedAt on intern
    await prisma.intern.update({
      where: { id: intern.id },
      data: { emailVerifiedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}

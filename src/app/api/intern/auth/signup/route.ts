import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { InternSignupFormValues } from "@/lib/intern/schema";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const data: InternSignupFormValues = await req.json();

    // Validate required fields
    if (!data.email || !data.password || !data.fullName || !data.phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (data.password !== data.confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check if email is already registered (not just pending)
    const existingIntern = await prisma.intern.findFirst({
      where: {
        personalEmail: data.email,
        NOT: { status: "PENDING_VERIFICATION" },
      },
    });

    if (existingIntern) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(data.password, 10);

    // Find or create intern record (may exist as pending)
    let intern = await prisma.intern.findFirst({
      where: {
        personalEmail: data.email,
        status: "PENDING_VERIFICATION",
      },
    });

    if (intern) {
      // Update existing pending record
      intern = await prisma.intern.update({
        where: { id: intern.id },
        data: {
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
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
          skillsAssessment: data.skillsAssessment
            ? JSON.parse(data.skillsAssessment)
            : undefined,
          passwordHash,
          consentGiven: data.consentGiven,
          status: "PENDING_VERIFICATION", // Awaiting admin approval
        },
      });
    } else {
      // Generate new internId for brand new signup (shouldn't happen normally)
      const year = new Date().getFullYear();
      const count = await prisma.intern.count({
        where: {
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
        },
      });
      const internId = `EWS-INT-${year}-${String(count + 1).padStart(4, "0")}`;

      // Create new intern record
      intern = await prisma.intern.create({
        data: {
          internId,
          personalEmail: data.email,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
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
          skillsAssessment: data.skillsAssessment
            ? JSON.parse(data.skillsAssessment)
            : undefined,
          passwordHash,
          emailVerifiedAt: new Date(), // Set email verified since OTP was verified
          consentGiven: data.consentGiven,
          status: "ACTIVE",
        },
      });
    }

    // internId was already generated in request-otp or will be the temp one
    // No need to regenerate

    // Send confirmation email
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "noreply@uu-recruitment.ews.aero",
      to: data.email,
      subject: "Welcome to UU Aviation Internship Portal",
      html: `
        <h2>Welcome, ${data.fullName}!</h2>
        <p>Your internship portal account has been created successfully.</p>
        <p><strong>Your Intern ID:</strong> ${intern.internId}</p>
        <p>You can now log in at <a href="https://careers.ews.aero/intern/login">careers.ews.aero/intern/login</a></p>
        <p>Once an admin approves your account, you'll have access to study materials and other resources.</p>
      `,
    });

    return NextResponse.json({ success: true, internId: intern.internId });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to complete signup" },
      { status: 500 }
    );
  }
}

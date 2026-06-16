import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ internId: string }> }
) {
  try {
    const { internId } = await params;

    // Auth check
    await requireRole("SUPER_ADMIN");

    // Find intern by ID (not internId)
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
    });

    if (!intern) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    // Update status to ACTIVE
    await prisma.intern.update({
      where: { id: internId },
      data: { status: "ACTIVE" },
    });

    // Send approval email
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "noreply@uu-recruitment.ews.aero",
      to: intern.personalEmail,
      subject: "Your UU Aviation Internship Portal Account Approved",
      html: `
        <h2>Account Approved!</h2>
        <p>Hi ${intern.fullName},</p>
        <p>Your internship portal account has been approved by an admin. You now have full access to:</p>
        <ul>
          <li>Study materials and modules</li>
          <li>Progress tracking</li>
          <li>Attendance log</li>
          <li>Notes and resources</li>
        </ul>
        <p>Log in at <a href="https://careers.ews.aero/intern/login">careers.ews.aero/intern/login</a></p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json(
      { error: "Failed to approve intern" },
      { status: 500 }
    );
  }
}

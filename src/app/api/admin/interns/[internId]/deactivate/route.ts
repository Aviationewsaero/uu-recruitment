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

    // Find intern
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
    });

    if (!intern) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    // Update status to INACTIVE
    await prisma.intern.update({
      where: { id: internId },
      data: { status: "INACTIVE" },
    });

    // Send deactivation email
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "noreply@uu-recruitment.ews.aero",
      to: intern.personalEmail,
      subject: "Your UU Aviation Internship Portal Access Deactivated",
      html: `
        <h2>Account Deactivated</h2>
        <p>Hi ${intern.fullName},</p>
        <p>Your internship portal account has been deactivated. If you believe this is an error, please contact the admin.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deactivate error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate intern" },
      { status: 500 }
    );
  }
}

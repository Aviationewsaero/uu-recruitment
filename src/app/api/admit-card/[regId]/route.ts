// Server-rendered PDF admit card via @react-pdf/renderer.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderAdmitCardPdf } from "@/lib/admit-card";

type Ctx = { params: Promise<{ regId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { regId } = await params;
  const student = await prisma.student.findUnique({
    where: { registrationId: regId },
    include: { token: true },
  });
  if (!student || !student.token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buf = await renderAdmitCardPdf({
    registrationId: student.registrationId,
    fullName: student.fullName,
    tokenNumber: student.token.tokenNumber,
    course: student.course,
    semester: student.semester,
    email: student.email,
    phone: student.phone,
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="admit-card-${regId}.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}

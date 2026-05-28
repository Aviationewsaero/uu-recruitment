// Server-rendered PDF admit card via @react-pdf/renderer.
// Protected: requires the per-student `admitCardToken` as `?t=` query param.
// Without the correct token, returns 404 (same response as missing student
// to avoid leaking which IDs exist).
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { renderAdmitCardPdf } from "@/lib/admit-card";

type Ctx = { params: Promise<{ regId: string }> };

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function GET(req: Request, { params }: Ctx) {
  const { regId } = await params;
  const url = new URL(req.url);
  const providedToken = url.searchParams.get("t") ?? "";

  const student = await prisma.student.findUnique({
    where: { registrationId: regId },
    include: { token: true },
  });

  // 404 (not 401/403) so attackers can't enumerate which reg IDs exist
  if (!student || !student.token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Token gate: must match the per-student secret. Legacy rows without a
  // token are still accessible (backwards compat) — only NEW registrations
  // get the token. Once you re-issue admit cards, this gate kicks in.
  if (student.admitCardToken) {
    if (!providedToken || !constantTimeEqual(providedToken, student.admitCardToken)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
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
      "Cache-Control": "private, no-store",
    },
  });
}

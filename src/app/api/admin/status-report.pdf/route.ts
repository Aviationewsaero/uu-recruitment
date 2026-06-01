// Generates and streams the Student Status Report PDF.
// SUPER_ADMIN gated. Accepts optional ?driveDate=, ?driveTitle=, ?notes=
// query params so the operator can customise the cover sheet from the
// admin form. Defaults to sensible values if not provided.

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { fmtIstDate, fmtIstDateTime } from "@/lib/format";
import {
  renderStatusReportPdf,
  type StatusReportStudent,
} from "@/lib/status-report";

export const dynamic = "force-dynamic";

const DEFAULT_TITLE = "UU Aviation Recruitment Drive 2026";
const DEFAULT_UNIVERSITY = "Uttaranchal University, Dehradun";

export async function GET(req: Request) {
  const me = await requireRole("SUPER_ADMIN");
  const url = new URL(req.url);

  const driveDate =
    url.searchParams.get("driveDate")?.trim() || fmtIstDate(new Date());
  const driveTitle =
    url.searchParams.get("driveTitle")?.trim() || DEFAULT_TITLE;
  const universityName =
    url.searchParams.get("university")?.trim() || DEFAULT_UNIVERSITY;
  const notes = url.searchParams.get("notes")?.trim() || undefined;

  // Pull every student with their token + status. ORDER BY tokenNumber so
  // each category section is naturally chronological by registration.
  const students = await prisma.student.findMany({
    orderBy: { createdAt: "asc" },
    include: { token: { select: { tokenNumber: true } } },
  });

  const payload: StatusReportStudent[] = students.map((s) => ({
    tokenNumber: s.token?.tokenNumber ?? null,
    registrationId: s.registrationId,
    fullName: s.fullName,
    phone: s.phone,
    course:
      s.course === "Other"
        ? s.customCourse ?? "Other"
        : s.course,
    semester: s.semester,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: s.status as any,
  }));

  const buf = await renderStatusReportPdf({
    driveDate,
    driveTitle,
    universityName,
    generatedAt: fmtIstDateTime(new Date()) + " IST",
    generatedBy: me.email,
    notes,
    students: payload,
  });

  const filename = `student-status-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

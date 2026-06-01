// Generates and streams the Student Status Report PDF (v2).
// SUPER_ADMIN gated. Accepts optional ?driveDate= ?driveTitle= ?university=
// ?notes= query params so the operator can customise the cover sheet.

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { fmtIstDate, fmtIstDateTime, fmtIstTime } from "@/lib/format";
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

  const driveTitle =
    url.searchParams.get("driveTitle")?.trim() || DEFAULT_TITLE;
  const universityName =
    url.searchParams.get("university")?.trim() || DEFAULT_UNIVERSITY;
  const notes = url.searchParams.get("notes")?.trim() || undefined;

  const [students, window] = await Promise.all([
    prisma.student.findMany({
      orderBy: { createdAt: "asc" },
      include: { token: { select: { tokenNumber: true } } },
    }),
    // Auto-compute "drive window" - earliest to latest registration. Gives
    // the cover-sheet a real start/end time without the operator typing.
    prisma.student.aggregate({
      _min: { createdAt: true },
      _max: { createdAt: true },
    }),
  ]);

  // Default the drive DATE to the day the first student registered (which
  // is the actual drive day) instead of the day the operator generates the
  // PDF. Operator override via ?driveDate= still wins.
  const driveDate =
    url.searchParams.get("driveDate")?.trim() ||
    (window._min.createdAt
      ? fmtIstDate(window._min.createdAt)
      : fmtIstDate(new Date()));

  let driveWindow: string | undefined = undefined;
  if (window._min.createdAt && window._max.createdAt) {
    driveWindow = `${fmtIstTime(window._min.createdAt)} - ${fmtIstTime(window._max.createdAt)} IST`;
  }

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
    driveWindow,
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

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import {
  parseStudentFilters,
  buildWhereClause,
} from "@/lib/admin/student-filters";

export const dynamic = "force-dynamic";

const COLUMNS: { key: string; label: string }[] = [
  { key: "tokenNumber", label: "Token" },
  { key: "registrationId", label: "Registration ID" },
  { key: "fullName", label: "Full Name" },
  { key: "fatherName", label: "Father" },
  { key: "motherName", label: "Mother" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "gender", label: "Gender" },
  { key: "course", label: "Course" },
  { key: "semester", label: "Semester" },
  { key: "specialization", label: "Specialization" },
  { key: "tenthPercent", label: "10th %" },
  { key: "tenthState", label: "10th State" },
  { key: "twelfthPercent", label: "12th %" },
  { key: "twelfthState", label: "12th State" },
  { key: "graduationCgpa", label: "Grad CGPA" },
  { key: "address", label: "Address" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Registered At" },
];

// H10: defend against CSV injection. Excel/Sheets will execute formulas
// in cells that start with =, +, -, @, or whitespace control chars (TAB,
// CR). Prefix any such value with a single quote so the spreadsheet
// renders it as text. The leading quote does NOT appear in the cell
// once parsed.
function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  await requireRole("SUPER_ADMIN", "EMAIL_MANAGER");
  const url = new URL(req.url);
  const sp: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (sp[k] = v));
  const filters = parseStudentFilters(sp);

  const students = await prisma.student.findMany({
    where: buildWhereClause(filters),
    include: { token: { select: { tokenNumber: true } } },
    orderBy: { createdAt: "desc" },
  });

  const lines: string[] = [
    COLUMNS.map((c) => csvEscape(c.label)).join(","),
    ...students.map((s) =>
      COLUMNS.map((c) => {
        if (c.key === "tokenNumber") return csvEscape(s.token?.tokenNumber);
        if (c.key === "createdAt")
          // IST-formatted so the CSV is human-readable when opened in
          // Excel/Sheets without operators mentally converting from UTC.
          return csvEscape(
            s.createdAt.toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            }) + " IST"
          );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return csvEscape((s as any)[c.key]);
      }).join(",")
    ),
  ];

  const csv = lines.join("\r\n");
  const filename = `students-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

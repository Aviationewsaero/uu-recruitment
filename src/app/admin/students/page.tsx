import Link from "next/link";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import {
  parseStudentFilters,
  buildWhereClause,
  buildSearchParams,
} from "@/lib/admin/student-filters";
import { StudentsFilters } from "./StudentsFilters";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SHORTLISTED: "bg-brand-blue/15 text-brand-blue",
  HOLD: "bg-orange-100 text-orange-700",
  RE_INTERVIEW: "bg-purple-100 text-purple-700",
  SELECTED: "bg-brand-green/15 text-brand-green-dark",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function StudentsPage({ searchParams }: PageProps) {
  await requireRole("SUPER_ADMIN", "EMAIL_MANAGER");
  const sp = await searchParams;
  const filters = parseStudentFilters(sp);
  const where = buildWhereClause(filters);

  const [students, total, courses, semesters] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { token: { select: { tokenNumber: true } } },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.student.count({ where }),
    prisma.student
      .findMany({ select: { course: true }, distinct: ["course"] })
      .then((rs) => rs.map((r) => r.course).filter(Boolean).sort()),
    prisma.student
      .findMany({ select: { semester: true }, distinct: ["semester"] })
      .then((rs) => rs.map((r) => r.semester).filter(Boolean).sort()),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const csvHref = `/api/admin/students.csv?${buildSearchParams(filters)}`;

  return (
    <div className="p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Students</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {total.toLocaleString()} student{total === 1 ? "" : "s"} match
            {total === 1 ? "es" : ""} current filter.
          </p>
        </div>
        <a
          href={csvHref}
          className="rounded-md border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg"
        >
          ⬇ Export CSV
        </a>
      </header>

      <StudentsFilters
        initial={filters}
        courses={courses}
        semesters={semesters}
      />

      <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
        <table className="w-full text-sm">
          <thead className="bg-brand-bg text-left text-xs uppercase tracking-widest text-brand-muted">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Reg ID</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Registered</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-16 text-center text-brand-muted"
                >
                  No students match this filter.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-brand-border hover:bg-brand-bg/50"
                >
                  <td className="px-4 py-3 text-2xl font-extrabold tabular-nums text-brand-navy leading-none">
                    #{s.token?.tokenNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/students/${s.registrationId}`}
                      className="font-medium text-brand-text hover:text-brand-blue hover:underline"
                    >
                      {s.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-muted">
                    {s.registrationId}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {s.course} · {s.semester}
                  </td>
                  <td className="px-4 py-3 text-brand-muted tabular-nums">
                    {s.phone}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[s.status] ?? "bg-brand-bg text-brand-muted"
                      }`}
                    >
                      {s.status.replace("_", " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-brand-muted">
                    {new Date(s.createdAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between">
          <p className="text-xs text-brand-muted">
            Page {filters.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {filters.page > 1 && (
              <Link
                href={`?${buildSearchParams({ ...filters, page: filters.page - 1 })}`}
                className="rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs hover:bg-brand-bg"
              >
                ← Prev
              </Link>
            )}
            {filters.page < totalPages && (
              <Link
                href={`?${buildSearchParams({ ...filters, page: filters.page + 1 })}`}
                className="rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs hover:bg-brand-bg"
              >
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

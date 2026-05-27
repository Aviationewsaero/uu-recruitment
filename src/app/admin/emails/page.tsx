import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { BulkEmailComposer } from "./BulkEmailComposer";

export const dynamic = "force-dynamic";

export default async function BulkEmailPage() {
  await requireRole("SUPER_ADMIN", "EMAIL_MANAGER");

  const [courses, semesters, recentLogs] = await Promise.all([
    prisma.student
      .findMany({ select: { course: true }, distinct: ["course"] })
      .then((rs) => rs.map((r) => r.course).filter(Boolean).sort()),
    prisma.student
      .findMany({ select: { semester: true }, distinct: ["semester"] })
      .then((rs) => rs.map((r) => r.semester).filter(Boolean).sort()),
    prisma.emailLog.findMany({
      where: { template: "bulk_announcement" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Bulk email</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Compose a custom message and target a slice of students.
          Sends in batches of 25 with 1.1s delay between batches (Resend
          rate-friendly).
        </p>
      </header>

      <BulkEmailComposer courses={courses} semesters={semesters} />

      {recentLogs.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-muted">
            Recent bulk sends
          </h2>
          <ul className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface divide-y divide-brand-border">
            {recentLogs.map((e) => (
              <li key={e.id} className="px-6 py-3 text-sm">
                <p className="font-medium">{e.subject}</p>
                <p className="text-xs text-brand-muted">
                  to {e.toEmail} · {e.status.toLowerCase()} ·{" "}
                  {new Date(e.createdAt).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

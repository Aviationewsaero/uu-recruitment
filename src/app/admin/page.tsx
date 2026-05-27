import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const me = await requireUser();
  const [totalStudents, waiting, inProgress, done, selected] = await Promise.all([
    prisma.student.count(),
    prisma.token.count({ where: { status: "WAITING" } }),
    prisma.token.count({ where: { status: "IN_PROGRESS" } }),
    prisma.token.count({ where: { status: "DONE" } }),
    prisma.student.count({ where: { status: "SELECTED" } }),
  ]);

  const tiles = [
    { label: "Registered", value: totalStudents, accent: "text-brand-navy" },
    { label: "Waiting", value: waiting, accent: "text-amber-600" },
    { label: "In progress", value: inProgress, accent: "text-brand-blue" },
    { label: "Completed", value: done, accent: "text-brand-green" },
    { label: "Selected", value: selected, accent: "text-brand-green-dark" },
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-brand-muted">
          Signed in as {me.email}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-brand-text">
          Drive overview
        </h1>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-lg border border-brand-border bg-brand-surface p-5"
          >
            <p className="text-xs uppercase tracking-widest text-brand-muted">
              {t.label}
            </p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${t.accent}`}>
              {t.value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-lg border border-dashed border-brand-border bg-brand-surface p-8 text-center text-sm text-brand-muted">
        Day 4 → recruiter dashboard. Day 5 → live queue + TV board.
        Day 6 → student list, bulk email, analytics charts.
      </div>
    </div>
  );
}

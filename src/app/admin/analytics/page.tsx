import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireRole("SUPER_ADMIN");

  const [
    totals,
    decisionBreakdown,
    recruiterPerf,
    durations,
    hourlyRegs,
  ] = await Promise.all([
    Promise.all([
      prisma.student.count(),
      prisma.token.count({ where: { status: "DONE" } }),
      prisma.student.count({ where: { status: "SELECTED" } }),
      prisma.student.count({ where: { status: "REJECTED" } }),
    ]),
    prisma.interviewLog.groupBy({
      by: ["decision"],
      _count: true,
    }),
    prisma.$queryRaw<
      { recruiter: string; total: number; selected: number; avg_sec: number }[]
    >`
      SELECT
        u."fullName" AS recruiter,
        COUNT(il.id)::int AS total,
        COUNT(CASE WHEN il.decision = 'SELECTED' THEN 1 END)::int AS selected,
        COALESCE(AVG(EXTRACT(EPOCH FROM (il."endedAt" - il."startedAt"))), 0)::int AS avg_sec
      FROM "InterviewLog" il
      LEFT JOIN "User" u ON u.id = il."recruiterId"
      GROUP BY u."fullName"
      ORDER BY total DESC
    `,
    prisma.$queryRaw<
      { avg_sec: number; max_sec: number; min_sec: number }[]
    >`
      SELECT
        COALESCE(AVG(EXTRACT(EPOCH FROM ("endedAt" - "startedAt"))), 0)::int AS avg_sec,
        COALESCE(MAX(EXTRACT(EPOCH FROM ("endedAt" - "startedAt"))), 0)::int AS max_sec,
        COALESCE(MIN(EXTRACT(EPOCH FROM ("endedAt" - "startedAt"))), 0)::int AS min_sec
      FROM "InterviewLog"
    `,
    prisma.$queryRaw<{ hour: Date; count: number }[]>`
      SELECT date_trunc('hour', "createdAt") AS hour, COUNT(*)::int AS count
      FROM "Student"
      WHERE "createdAt" > NOW() - INTERVAL '24 hours'
      GROUP BY hour ORDER BY hour ASC
    `,
  ]);

  const [registered, interviewsDone, selected, rejected] = totals;
  const dur = durations[0] ?? { avg_sec: 0, max_sec: 0, min_sec: 0 };

  return (
    <div className="p-8 space-y-10">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Analytics</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Drive-day snapshot. Refresh the page for latest numbers.
        </p>
      </header>

      {/* Totals row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Registered" value={registered} accent="text-brand-navy" />
        <Tile
          label="Interviews completed"
          value={interviewsDone}
          accent="text-brand-blue"
        />
        <Tile label="Selected" value={selected} accent="text-brand-green-dark" />
        <Tile label="Rejected" value={rejected} accent="text-red-700" />
      </section>

      {/* Hourly registrations */}
      <Section title="Hourly registrations (last 24h)">
        <BarChart
          data={hourlyRegs.map((r) => ({
            label: new Date(r.hour).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              hour12: false,
            }),
            value: Number(r.count),
          }))}
          fill="var(--color-brand-blue)"
        />
      </Section>

      {/* Decision breakdown */}
      <Section title="Decision breakdown">
        <BarChart
          data={decisionBreakdown.map((r) => ({
            label: r.decision.replace("_", " "),
            value: Number(r._count),
          }))}
          fill="var(--color-brand-green)"
        />
      </Section>

      {/* Recruiter table */}
      <Section title="Recruiter throughput">
        <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
          <table className="w-full">
            <thead className="bg-brand-bg text-left text-xs font-semibold uppercase tracking-widest text-brand-muted">
              <tr>
                <th className="px-4 py-3">Recruiter</th>
                <th className="px-4 py-3">Interviews</th>
                <th className="px-4 py-3">Selected</th>
                <th className="px-4 py-3">Avg duration</th>
              </tr>
            </thead>
            <tbody>
              {recruiterPerf.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-brand-muted">
                    No interviews recorded yet.
                  </td>
                </tr>
              ) : (
                recruiterPerf.map((r) => (
                  <tr key={r.recruiter} className="border-t border-brand-border">
                    <td className="px-4 py-4 text-base font-semibold text-brand-text">
                      {r.recruiter}
                    </td>
                    <td className="px-4 py-4 text-2xl font-extrabold tabular-nums text-brand-blue">
                      {r.total}
                    </td>
                    <td className="px-4 py-4 text-2xl font-extrabold tabular-nums text-brand-green-dark">
                      {r.selected}
                    </td>
                    <td className="px-4 py-4 text-base font-bold tabular-nums text-brand-text">
                      {formatDuration(r.avg_sec)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Interview duration stats */}
      <Section title="Interview duration">
        <div className="grid gap-4 sm:grid-cols-3">
          <Tile label="Average" value={formatDuration(dur.avg_sec)} accent="text-brand-text" raw />
          <Tile label="Shortest" value={formatDuration(dur.min_sec)} accent="text-brand-muted" raw />
          <Tile label="Longest" value={formatDuration(dur.max_sec)} accent="text-brand-muted" raw />
        </div>
      </Section>
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
  raw = false,
}: {
  label: string;
  value: number | string;
  accent: string;
  raw?: boolean;
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
        {label}
      </p>
      <p
        className={`mt-3 text-6xl font-extrabold leading-none tabular-nums tracking-tight ${accent}`}
      >
        {raw ? value : Number(value).toLocaleString()}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function BarChart({
  data,
  fill,
}: {
  data: { label: string; value: number }[];
  fill: string;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-brand-border bg-brand-surface p-8 text-center text-sm text-brand-muted">
        No data yet.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex items-end gap-3 h-64">
        {data.map((d) => (
          <div
            key={d.label}
            className="flex-1 h-full flex flex-col items-center justify-end gap-2 group"
          >
            <span className="text-2xl font-extrabold tabular-nums text-brand-text leading-none">
              {d.value}
            </span>
            <div
              style={{
                height: `${Math.max(2, (d.value / max) * 90)}%`,
                background: fill,
              }}
              className="w-full rounded-t transition-all"
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-xs font-semibold text-brand-muted text-center truncate w-full">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

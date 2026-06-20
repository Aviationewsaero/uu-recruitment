import Link from "next/link";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import {
  Users,
  ClipboardList,
  Mail,
  BarChart2,
  FileText,
  MonitorPlay,
  QrCode,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const me = await requireUser();

  const [
    tokenByStatus,
    studentByStatus,
    totalStudents,
    recentStudents,
    recruiterLeaderboard,
  ] = await Promise.all([
    prisma.token.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.student.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.student.count(),
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        registrationId: true,
        fullName: true,
        course: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.$queryRaw<{ recruiter: string; total: number; selected: number }[]>`
      SELECT
        u."fullName" AS recruiter,
        COUNT(il.id)::int AS total,
        COUNT(CASE WHEN il.decision = 'SELECTED' THEN 1 END)::int AS selected
      FROM "InterviewLog" il
      LEFT JOIN "User" u ON u.id = il."recruiterId"
      GROUP BY u."fullName"
      ORDER BY total DESC
      LIMIT 6
    `,
  ]);

  const tok = (s: string) =>
    tokenByStatus.find((r) => r.status === s)?._count._all ?? 0;
  const stu = (s: string) =>
    studentByStatus.find((r) => r.status === s)?._count._all ?? 0;

  const waiting = tok("WAITING");
  const inProgress = tok("IN_PROGRESS");
  const done = tok("DONE");
  const skipped = tok("SKIPPED");
  const noShow = tok("NO_SHOW");

  const selected = stu("SELECTED");
  const rejected = stu("REJECTED");
  const hold = stu("HOLD");

  const interviewsDone = done;
  const selectionRate =
    interviewsDone > 0 ? Math.round((selected / interviewsDone) * 100) : 0;
  const completionRate =
    totalStudents > 0 ? Math.round((interviewsDone / totalStudents) * 100) : 0;

  const topStats = [
    { label: "Registered", value: totalStudents, accent: "text-brand-navy", href: "/admin/students" },
    { label: "Waiting", value: waiting, accent: "text-amber-600", href: "/admin/queue" },
    { label: "In progress", value: inProgress, accent: "text-brand-blue", href: "/admin/queue" },
    { label: "Completed", value: done, accent: "text-brand-green", href: "/admin/students" },
    { label: "Selected", value: selected, accent: "text-emerald-700", href: "/admin/students" },
  ];

  const quickLinks = [
    { label: "Live Monitor", href: "/admin/live", icon: MonitorPlay, color: "bg-blue-50 text-blue-700" },
    { label: "Live Queue", href: "/admin/queue", icon: ClipboardList, color: "bg-amber-50 text-amber-700" },
    { label: "Students", href: "/admin/students", icon: Users, color: "bg-slate-50 text-slate-700" },
    { label: "Bulk Email", href: "/admin/emails", icon: Mail, color: "bg-purple-50 text-purple-700" },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart2, color: "bg-green-50 text-green-700" },
    { label: "Status Report", href: "/admin/status-report", icon: FileText, color: "bg-rose-50 text-rose-700" },
    { label: "QR Poster", href: "/admin/qr-poster", icon: QrCode, color: "bg-cyan-50 text-cyan-700" },
    { label: "Interns", href: "/admin/interns", icon: UserCheck, color: "bg-orange-50 text-orange-700" },
  ];

  const tokenBreakdown = [
    { label: "Waiting", value: waiting, bar: "bg-amber-400" },
    { label: "In progress", value: inProgress, bar: "bg-blue-400" },
    { label: "Done", value: done, bar: "bg-green-500" },
    { label: "Skipped", value: skipped, bar: "bg-slate-300" },
    { label: "No-show", value: noShow, bar: "bg-red-300" },
  ];
  const tokenTotal = waiting + inProgress + done + skipped + noShow || 1;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-brand-muted">
          Signed in as {me.email}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-brand-text">
          Drive overview
        </h1>
      </div>

      {/* Top stat tiles */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {topStats.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-xl border border-brand-border bg-brand-surface p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <p className="text-xs uppercase tracking-widest text-brand-muted">
              {t.label}
            </p>
            <p className={`mt-2 text-4xl font-extrabold tabular-nums ${t.accent}`}>
              {t.value.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>

      {/* Middle row: funnel + queue breakdown + quick links */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Funnel */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-5">
            Selection funnel
          </h2>
          <div className="space-y-3">
            <FunnelBar label="Registered" value={totalStudents} max={totalStudents} color="bg-brand-navy" />
            <FunnelBar label="Interviews done" value={interviewsDone} max={totalStudents} color="bg-brand-blue" pct={completionRate} />
            <FunnelBar label="Selected" value={selected} max={totalStudents} color="bg-brand-green" pct={selectionRate} pctOf="of done" />
            <FunnelBar label="Rejected" value={rejected} max={totalStudents} color="bg-red-400" />
            <FunnelBar label="On hold" value={hold} max={totalStudents} color="bg-amber-400" />
          </div>
        </div>

        {/* Queue token breakdown */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-5">
            Queue breakdown
          </h2>
          <div className="space-y-3">
            {tokenBreakdown.map((t) => (
              <div key={t.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-brand-muted font-medium">{t.label}</span>
                  <span className="font-bold text-brand-text tabular-nums">{t.value}</span>
                </div>
                <div className="h-2 rounded-full bg-brand-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${t.bar} transition-all`}
                    style={{ width: `${Math.max(2, (t.value / tokenTotal) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/queue" className="mt-5 inline-block text-xs font-semibold text-brand-blue hover:underline">
            Open live queue →
          </Link>
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-5">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-xs font-semibold text-brand-text hover:bg-white hover:shadow-sm transition-all"
              >
                <span className={`rounded-md p-1.5 ${q.color}`}>
                  <q.icon size={13} strokeWidth={2} />
                </span>
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: recent registrations + recruiter leaderboard */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">

        {/* Recent registrations */}
        <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
              Recent registrations
            </h2>
            <Link href="/admin/students" className="text-xs font-semibold text-brand-blue hover:underline">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-bg text-left text-[10px] font-semibold uppercase tracking-widest text-brand-muted">
                <th className="px-6 py-2">ID</th>
                <th className="px-6 py-2">Name</th>
                <th className="px-6 py-2 hidden md:table-cell">Course</th>
                <th className="px-6 py-2">Status</th>
                <th className="px-6 py-2 hidden lg:table-cell">Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((s) => (
                <tr key={s.registrationId} className="border-t border-brand-border hover:bg-brand-bg/50">
                  <td className="px-6 py-3 font-mono text-xs text-brand-muted">{s.registrationId}</td>
                  <td className="px-6 py-3 font-semibold text-brand-text">{s.fullName}</td>
                  <td className="px-6 py-3 text-brand-muted hidden md:table-cell truncate max-w-[160px]">{s.course}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-6 py-3 text-xs text-brand-muted hidden lg:table-cell whitespace-nowrap">
                    {new Date(s.createdAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>
                </tr>
              ))}
              {recentStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-brand-muted text-sm">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recruiter leaderboard */}
        <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden w-full lg:w-64 shrink-0">
          <div className="px-5 py-4 border-b border-brand-border">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
              Recruiter leaderboard
            </h2>
          </div>
          <div className="divide-y divide-brand-border">
            {recruiterLeaderboard.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-brand-muted">
                No interviews recorded yet.
              </p>
            ) : (
              recruiterLeaderboard.map((r, i) => (
                <div key={r.recruiter} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-lg font-extrabold tabular-nums text-brand-muted w-5 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-text truncate">{r.recruiter ?? "—"}</p>
                    <p className="text-xs text-brand-muted">
                      {r.total} done · {r.selected} selected
                    </p>
                  </div>
                  <span className="text-xs font-bold text-brand-green shrink-0">
                    {r.total > 0 ? `${Math.round((r.selected / r.total) * 100)}%` : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="px-5 py-3 border-t border-brand-border">
            <Link href="/admin/analytics" className="text-xs font-semibold text-brand-blue hover:underline">
              Full analytics →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
  pct,
  pctOf,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  pct?: number;
  pctOf?: string;
}) {
  const width = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-brand-muted font-medium">{label}</span>
        <span className="font-bold text-brand-text tabular-nums">
          {value.toLocaleString()}
          {pct !== undefined && (
            <span className="ml-1.5 text-brand-muted font-normal">
              ({pct}%{pctOf ? ` ${pctOf}` : ""})
            </span>
          )}
        </span>
      </div>
      <div className="h-2 rounded-full bg-brand-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  SHORTLISTED: "bg-blue-100 text-blue-700",
  SELECTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  HOLD: "bg-amber-100 text-amber-700",
  RE_INTERVIEW: "bg-purple-100 text-purple-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

// Super-admin-only pre-launch data purge. One screen shows current
// row counts + a typed-confirmation button that wipes all
// student-side data so the drive starts clean from token #1.
//
// KEEPS: User, Room, AuditLog (so staff logins + history survive)
// PURGES: Student, Token, InterviewLog, EmailLog
// RESETS: the Token.tokenNumber serial sequence to 1

import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { ResetPanel } from "./ResetPanel";

export const dynamic = "force-dynamic";

export default async function DataResetPage() {
  await requireRole("SUPER_ADMIN");

  const [students, tokens, interviews, emails, audits, rooms, users, nextToken] = await Promise.all([
    prisma.student.count(),
    prisma.token.count(),
    prisma.interviewLog.count(),
    prisma.emailLog.count(),
    prisma.auditLog.count(),
    prisma.room.count(),
    prisma.user.count(),
    prisma.token.aggregate({ _max: { tokenNumber: true } }),
  ]);

  const lastToken = nextToken._max.tokenNumber ?? 0;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Reset drive data</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Wipe all test student registrations + tokens before drive day so
          the first real student lands on token #1. Staff logins, rooms,
          and the audit log are kept.
        </p>
      </header>

      <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-muted">
          Current row counts
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <Stat label="Students" value={students} kind="purge" />
          <Stat label="Tokens" value={tokens} kind="purge" extra={`last #${lastToken}`} />
          <Stat label="Interview decisions" value={interviews} kind="purge" />
          <Stat label="Email log rows" value={emails} kind="purge" />
          <Stat label="Staff (keep)" value={users} kind="keep" />
          <Stat label="Rooms (keep)" value={rooms} kind="keep" />
          <Stat label="Audit log (keep)" value={audits} kind="keep" />
        </dl>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-red-700">
          Destructive action
        </h2>
        <p className="mt-2 text-sm text-red-900">
          This deletes <strong>every</strong> Student, Token, InterviewLog,
          and EmailLog row in the database. Resets the token sequence so
          the next registration becomes #1. There is no undo.
        </p>
        <ul className="mt-3 text-xs text-red-900 list-disc pl-5 space-y-0.5">
          <li>Staff accounts and room assignments survive.</li>
          <li>The audit log keeps a permanent record of the purge.</li>
          <li>Resume + photo files in Supabase Storage are NOT deleted (they orphan).</li>
        </ul>
        <div className="mt-5">
          <ResetPanel />
        </div>
      </section>

      <p className="text-xs text-brand-muted">
        Use only before the first real student registers. Once the drive
        starts, treat this page as read-only.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  kind,
  extra,
}: {
  label: string;
  value: number;
  kind: "purge" | "keep";
  extra?: string;
}) {
  const tone =
    kind === "purge"
      ? "border-red-200 bg-red-50/40"
      : "border-brand-border bg-brand-bg";
  return (
    <div className={`rounded-md border ${tone} p-4`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
        {label}
      </p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums text-brand-text">
        {value.toLocaleString()}
      </p>
      {extra && <p className="text-[11px] text-brand-muted mt-0.5">{extra}</p>}
    </div>
  );
}

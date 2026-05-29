// Drive-day live monitor. Single pane that the super admin keeps open
// during the drive. Auto-refreshes every 10 seconds (client component
// triggers router.refresh).
//
// Shows: registrations/min, token state breakdown, room activity heat,
// email send health, failed-login feed. Nothing here mutates - read-only.

import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { LiveRefresh } from "./LiveRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ONE_MIN = 60 * 1000;
const HOUR = 60 * ONE_MIN;

function fmtTime(d: Date | null | undefined): string {
  if (!d) return "—";
  const diff = Date.now() - d.getTime();
  if (diff < ONE_MIN) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / ONE_MIN)}m ago`;
  return `${Math.floor(diff / HOUR)}h ago`;
}

export default async function LivePage() {
  await requireRole("SUPER_ADMIN");
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - HOUR);
  const fiveMinAgo = new Date(now.getTime() - 5 * ONE_MIN);

  const [
    tokenByStatus,
    regsLastHour,
    regsLast5,
    emailsSentLastHour,
    emailsFailedLastHour,
    failedLogins,
    rooms,
    recentAudit,
  ] = await Promise.all([
    prisma.token.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.student.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.student.count({ where: { createdAt: { gte: fiveMinAgo } } }),
    prisma.emailLog.count({
      where: { status: "SENT", createdAt: { gte: oneHourAgo } },
    }),
    prisma.emailLog.count({
      where: { status: "FAILED", createdAt: { gte: oneHourAgo } },
    }),
    prisma.auditLog.findMany({
      where: {
        action: "auth.login_failed",
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { createdAt: true, target: true, payload: true },
    }),
    prisma.room.findMany({
      where: { active: true },
      orderBy: { roomNumber: "asc" },
      select: {
        id: true,
        roomNumber: true,
        displayName: true,
        currentTokenId: true,
        recruiter: { select: { fullName: true } },
        interviewLogs: {
          orderBy: { endedAt: "desc" },
          take: 1,
          select: { endedAt: true },
        },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        createdAt: true,
        action: true,
        target: true,
        payload: true,
      },
    }),
  ]);

  const statusCount = (s: string) =>
    tokenByStatus.find((r) => r.status === s)?._count._all ?? 0;
  const waiting = statusCount("WAITING");
  const called = statusCount("CALLED");
  const inProgress = statusCount("IN_PROGRESS");
  const done = statusCount("DONE");
  const skipped = statusCount("SKIPPED");
  const noShow = statusCount("NO_SHOW");

  const emailHealth =
    emailsSentLastHour + emailsFailedLastHour === 0
      ? "idle"
      : emailsFailedLastHour > emailsSentLastHour * 0.05
        ? "warning"
        : "ok";

  return (
    <div className="p-6 space-y-6">
      <LiveRefresh />

      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            Drive-day · live monitor
          </p>
          <h1 className="mt-1 text-2xl font-bold text-brand-text">
            War room
          </h1>
        </div>
        <p className="text-xs text-brand-muted">
          Auto-refresh every 10s · last fetch{" "}
          {now.toLocaleTimeString("en-IN")}
        </p>
      </header>

      {/* TOP ROW — registration velocity */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Tile
          label="Last 5 min"
          value={regsLast5}
          unit="registrations"
          accent="text-brand-blue"
        />
        <Tile
          label="Last hour"
          value={regsLastHour}
          unit="registrations"
          accent="text-brand-navy"
        />
        <Tile
          label="Pace"
          value={Math.round((regsLastHour / 60) * 10) / 10}
          unit="per minute"
          accent="text-brand-green-dark"
        />
      </section>

      {/* TOKEN STATE */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-muted">
          Token state right now
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <StateTile label="Waiting" value={waiting} tone="amber" />
          <StateTile label="Called" value={called} tone="blue" />
          <StateTile label="In progress" value={inProgress} tone="blue" />
          <StateTile label="Done" value={done} tone="green" />
          <StateTile label="Skipped" value={skipped} tone="muted" />
          <StateTile label="No-show" value={noShow} tone="muted" />
        </div>
      </section>

      {/* ROOMS — per-room health */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-muted">
          Rooms
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.map((r) => {
            const lastDone = r.interviewLogs[0]?.endedAt ?? null;
            const idle = !r.currentTokenId && lastDone
              ? Date.now() - lastDone.getTime()
              : 0;
            const hot = !!r.currentTokenId;
            const stale = !hot && idle > 15 * ONE_MIN && lastDone;
            return (
              <div
                key={r.id}
                className={`rounded-lg border p-4 ${
                  hot
                    ? "border-brand-green/50 bg-brand-green/5"
                    : stale
                      ? "border-amber-300 bg-amber-50"
                      : "border-brand-border bg-brand-surface"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                  {r.roomNumber} · {r.displayName}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-text">
                  {r.recruiter?.fullName ?? "(unassigned)"}
                </p>
                <p className="mt-2 text-xs">
                  {hot ? (
                    <span className="text-brand-green-dark font-bold">
                      ● Interviewing now
                    </span>
                  ) : stale ? (
                    <span className="text-amber-700 font-bold">
                      ⚠ Idle {Math.floor(idle / ONE_MIN)}m
                    </span>
                  ) : (
                    <span className="text-brand-muted">
                      Last done: {fmtTime(lastDone)}
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* EMAIL HEALTH + FAILED LOGINS */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div
          className={`rounded-lg border p-4 ${
            emailHealth === "warning"
              ? "border-red-300 bg-red-50"
              : "border-brand-border bg-brand-surface"
          }`}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            Email pipeline (last 1h)
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-3xl font-extrabold tabular-nums text-brand-green-dark">
                {emailsSentLastHour}
              </p>
              <p className="text-xs text-brand-muted">sent ok</p>
            </div>
            <div>
              <p
                className={`text-3xl font-extrabold tabular-nums ${
                  emailsFailedLastHour > 0 ? "text-red-700" : "text-brand-muted"
                }`}
              >
                {emailsFailedLastHour}
              </p>
              <p className="text-xs text-brand-muted">failed</p>
            </div>
          </div>
          {emailHealth === "warning" && (
            <p className="mt-2 text-xs font-semibold text-red-700">
              ⚠ Failure rate above 5% — check Resend dashboard
            </p>
          )}
        </div>

        <div
          className={`rounded-lg border p-4 ${
            failedLogins.length >= 5
              ? "border-amber-300 bg-amber-50"
              : "border-brand-border bg-brand-surface"
          }`}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            Failed staff logins (last 1h)
          </h3>
          <p
            className={`mt-2 text-3xl font-extrabold tabular-nums ${
              failedLogins.length >= 5 ? "text-amber-700" : "text-brand-muted"
            }`}
          >
            {failedLogins.length}
          </p>
          {failedLogins.length > 0 ? (
            <ul className="mt-2 space-y-0.5 text-xs text-brand-text max-h-24 overflow-y-auto">
              {failedLogins.slice(0, 5).map((f, i) => (
                <li key={i} className="font-mono">
                  {f.createdAt.toLocaleTimeString("en-IN")} — {f.target}{" "}
                  {(f.payload as { reason?: string } | null)?.reason
                    ? `(${(f.payload as { reason: string }).reason})`
                    : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-brand-muted mt-1">
              No failed attempts. ✅
            </p>
          )}
          {failedLogins.length >= 5 && (
            <p className="mt-2 text-xs font-semibold text-amber-700">
              ⚠ 5+ failed attempts — possible brute-force, IP rate limit
              should kick in
            </p>
          )}
        </div>
      </section>

      {/* RECENT AUDIT FEED */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-muted">
          Recent activity (last 15 events)
        </h2>
        <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
          <ul className="divide-y divide-brand-border">
            {recentAudit.length === 0 ? (
              <li className="px-4 py-3 text-sm text-brand-muted">
                No audit events yet.
              </li>
            ) : (
              recentAudit.map((a, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2 text-xs">
                  <span className="font-mono text-brand-muted tabular-nums">
                    {a.createdAt.toLocaleTimeString("en-IN")}
                  </span>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      a.action.includes("fail")
                        ? "bg-red-100 text-red-700"
                        : a.action.includes("purge") ||
                            a.action.includes("delete")
                          ? "bg-amber-100 text-amber-800"
                          : a.action.includes("login")
                            ? "bg-brand-blue/15 text-brand-blue"
                            : "bg-brand-green/15 text-brand-green-dark"
                    }`}
                  >
                    {a.action}
                  </span>
                  <span className="font-mono text-brand-muted truncate flex-1">
                    {a.target}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
        {label}
      </p>
      <p
        className={`mt-2 text-5xl font-extrabold tabular-nums leading-none ${accent}`}
      >
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-brand-muted">{unit}</p>
    </div>
  );
}

function StateTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "blue" | "green" | "muted";
}) {
  const colors = {
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    blue: "text-brand-blue bg-brand-blue/5 border-brand-blue/30",
    green: "text-brand-green-dark bg-brand-green/5 border-brand-green/30",
    muted: "text-brand-muted bg-brand-bg border-brand-border",
  }[tone];
  return (
    <div className={`rounded-md border p-3 text-center ${colors}`}>
      <p className="text-2xl font-extrabold tabular-nums leading-none">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

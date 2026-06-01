// Super-admin tool to download the Student Status Report PDF. Lets the
// operator customise the cover-sheet metadata (drive date, title,
// university name, optional notes) before generating.

import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { fmtIstDate } from "@/lib/format";
import { ReportForm } from "./ReportForm";

export const dynamic = "force-dynamic";

export default async function StatusReportPage() {
  await requireRole("SUPER_ADMIN");

  // Snapshot live counts so the operator sees what the PDF will contain.
  const [total, advanced, underReview, notShortlisted, pending, earliest] =
    await Promise.all([
      prisma.student.count(),
      prisma.student.count({
        where: { status: { in: ["SELECTED", "SHORTLISTED"] } },
      }),
      prisma.student.count({
        where: { status: { in: ["HOLD", "RE_INTERVIEW"] } },
      }),
      prisma.student.count({ where: { status: "REJECTED" } }),
      prisma.student.count({ where: { status: "PENDING" } }),
      prisma.student.aggregate({ _min: { createdAt: true } }),
    ]);

  // Pre-fill the date form field with the actual drive day (day the
  // first student registered) rather than the day the operator opens
  // the page. They can still override.
  const today = earliest._min.createdAt
    ? fmtIstDate(earliest._min.createdAt)
    : fmtIstDate(new Date());

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Status Report</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Generate the university-facing PDF showing how each registered
          student performed in the drive. Combines internal &quot;Selected&quot; and
          &quot;Shortlisted&quot; into a single <strong>Shortlisted for Placement
          Consideration</strong> bucket so partner allocation can stay on its
          August timeline without external pressure.
        </p>
      </header>

      {/* Snapshot card */}
      <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
          What the report will contain
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Students" value={total} />
          <Stat label="Shortlisted" value={advanced} accent="text-brand-green-dark" />
          <Stat label="Under review" value={underReview} accent="text-amber-700" />
          <Stat label="Not shortlisted" value={notShortlisted} accent="text-red-700" />
        </div>
        {pending > 0 && (
          <p className="mt-3 text-xs text-brand-muted">
            {pending} student{pending === 1 ? " is" : "s are"} still pending
            interview - included as &quot;Interview Not Completed&quot;.
          </p>
        )}
      </section>

      {/* Form */}
      <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-4">
          Cover sheet
        </h2>
        <ReportForm defaultDate={today} />
      </section>

      {/* Strategic note */}
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-semibold text-amber-900">Strategic positioning</p>
        <p className="mt-1 text-amber-900 leading-relaxed">
          The PDF deliberately merges <code>SELECTED</code> +{" "}
          <code>SHORTLISTED</code> into <em>Shortlisted for Placement
          Consideration</em>. This signals a strong pipeline to the university
          without committing to specific offer counts before EWS&apos;s August
          airport-partner allocation window opens. Internal numbers remain
          accurate in /admin/students and /admin/analytics.
        </p>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "text-brand-text",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-md border border-brand-border bg-brand-bg p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-muted">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${accent}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

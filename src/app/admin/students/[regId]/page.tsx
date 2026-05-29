import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/storage";
import { fmtIstDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ regId: string }> };

export default async function StudentDetailPage({ params }: PageProps) {
  await requireRole("SUPER_ADMIN", "EMAIL_MANAGER");
  const { regId } = await params;
  const student = await prisma.student.findUnique({
    where: { registrationId: regId },
    include: {
      token: true,
      interviewLogs: {
        orderBy: { createdAt: "desc" },
        include: { recruiter: { select: { fullName: true } }, room: { select: { displayName: true } } },
      },
      emailLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!student) notFound();

  const [photoUrl, resumeUrl] = await Promise.all([
    student.passportPhoto
      ? getFileUrl("student-documents", student.passportPhoto)
      : null,
    student.resumeUrl
      ? getFileUrl("student-documents", student.resumeUrl)
      : null,
  ]);

  return (
    <div className="p-8">
      <Link
        href="/admin/students"
        className="text-xs text-brand-muted hover:text-brand-text"
      >
        ← All students
      </Link>

      <header className="mt-4 flex items-start gap-5">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={student.fullName}
            className="h-20 w-20 rounded-lg object-cover border border-brand-border"
          />
        ) : (
          <div className="h-20 w-20 rounded-lg bg-brand-bg border border-brand-border" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-brand-text">
              {student.fullName}
            </h1>
            <span className="text-3xl font-extrabold tabular-nums text-brand-navy leading-none tracking-tight">
              #{student.token?.tokenNumber ?? "—"}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-brand-muted">
            {student.registrationId}
          </p>
          <p className="mt-2 inline-block rounded-full bg-brand-bg border border-brand-border px-3 py-1 text-xs font-medium">
            {student.status.replace("_", " ").toLowerCase()}
          </p>
        </div>
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-dark"
          >
            Open résumé →
          </a>
        )}
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT — student data */}
        <section className="rounded-xl border border-brand-border bg-brand-surface">
          <h2 className="border-b border-brand-border px-6 py-4 text-sm font-semibold uppercase tracking-widest text-brand-muted">
            Application data
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-6 text-sm sm:grid-cols-3">
            <Detail label="Email" value={student.email} />
            <Detail label="Phone" value={student.phone} />
            <Detail label="Gender" value={student.gender} />
            <Detail label="Father's name" value={student.fatherName ?? "—"} />
            <Detail label="Mother's name" value={student.motherName ?? "—"} />
            <Detail label="Course" value={student.course} />
            <Detail label="Semester" value={student.semester} />
            <Detail label="Specialization" value={student.specialization ?? "—"} />
            <Detail label="10th %" value={student.tenthPercent.toString()} />
            <Detail label="12th %" value={student.twelfthPercent.toString()} />
            <Detail
              label="Grad CGPA"
              value={student.graduationCgpa?.toString() ?? "—"}
            />
            <Detail label="10th state" value={student.tenthState ?? "—"} />
            <Detail label="12th state" value={student.twelfthState ?? "—"} />
            <div className="col-span-2 sm:col-span-3">
              <Detail label="Address" value={student.address ?? "—"} />
            </div>
          </dl>
        </section>

        {/* RIGHT — history */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-brand-border bg-brand-surface">
            <h2 className="border-b border-brand-border px-6 py-4 text-sm font-semibold uppercase tracking-widest text-brand-muted">
              Interview history
            </h2>
            <ul className="divide-y divide-brand-border">
              {student.interviewLogs.length === 0 && (
                <li className="px-6 py-4 text-sm text-brand-muted">
                  No interviews yet.
                </li>
              )}
              {student.interviewLogs.map((log) => (
                <li key={log.id} className="px-6 py-4 text-sm">
                  <p className="font-medium text-brand-text">
                    {log.decision.replace("_", " ")} ·{" "}
                    <span className="text-amber-600">
                      {"★".repeat(log.rating ?? 0)}
                      {"☆".repeat(5 - (log.rating ?? 0))}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-brand-muted">
                    by {log.recruiter.fullName} · {log.room.displayName}
                  </p>
                  {log.notes && (
                    <p className="mt-2 text-xs italic text-brand-muted">
                      “{log.notes}”
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-brand-border bg-brand-surface">
            <h2 className="border-b border-brand-border px-6 py-4 text-sm font-semibold uppercase tracking-widest text-brand-muted">
              Emails sent
            </h2>
            <ul className="divide-y divide-brand-border">
              {student.emailLogs.length === 0 && (
                <li className="px-6 py-4 text-sm text-brand-muted">
                  No emails sent.
                </li>
              )}
              {student.emailLogs.map((e) => (
                <li key={e.id} className="px-6 py-4 text-xs">
                  <p className="font-medium text-brand-text">{e.subject}</p>
                  <p className="mt-0.5 text-brand-muted">
                    {e.template} ·{" "}
                    <span
                      className={
                        e.status === "SENT"
                          ? "text-brand-green-dark"
                          : e.status === "FAILED"
                            ? "text-red-700"
                            : "text-brand-muted"
                      }
                    >
                      {e.status.toLowerCase()}
                    </span>{" "}
                    · {fmtIstDateTime(e.createdAt)} IST
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-brand-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-brand-text break-words">{value}</dd>
    </div>
  );
}

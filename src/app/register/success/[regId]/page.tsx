import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ regId: string }> };

export default async function SuccessPage({ params }: PageProps) {
  const { regId } = await params;
  const student = await prisma.student.findUnique({
    where: { registrationId: regId },
    include: { token: true },
  });
  if (!student || !student.token) notFound();

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-sm">
          <div className="bg-gradient-to-br from-brand-navy to-brand-navy-dark px-8 py-10 text-white">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
              <span className="inline-block h-px w-6 bg-brand-green" />
              Registration confirmed
            </div>
            <h1 className="mt-2 text-3xl font-bold">
              You&apos;re in, {student.fullName.split(" ")[0]}.
            </h1>
            <p className="mt-2 text-white/85">
              We&apos;ve emailed your admit card to{" "}
              <strong>{student.email}</strong>.
            </p>
          </div>

          <div className="grid sm:grid-cols-2">
            <div className="border-r border-brand-border p-8">
              <p className="text-xs uppercase tracking-widest text-brand-muted">
                Your token number
              </p>
              <p className="mt-2 text-7xl font-bold text-brand-green tabular-nums">
                #{student.token.tokenNumber}
              </p>
            </div>
            <div className="p-8">
              <p className="text-xs uppercase tracking-widest text-brand-muted">
                Registration ID
              </p>
              <p className="mt-2 font-mono text-lg text-brand-text">
                {student.registrationId}
              </p>
              <p className="mt-6 text-xs uppercase tracking-widest text-brand-muted">
                Name
              </p>
              <p className="mt-1 font-medium">{student.fullName}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-brand-muted">
                Course
              </p>
              <p className="mt-1">{student.course} · {student.semester}</p>
            </div>
          </div>

          <div className="border-t border-brand-border bg-brand-bg p-8">
            <h2 className="text-base font-semibold text-brand-text">
              What to do next
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-brand-text">
              <li>
                <strong>Download your admit card</strong> — print it or keep it
                on your phone. You&apos;ll need it at the venue.
              </li>
              <li>
                <strong>Watch the live display</strong> for your token number on
                drive day.
              </li>
              <li>
                <strong>Arrive 30 minutes early</strong> with a government photo
                ID.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={
                  `/api/admit-card/${student.registrationId}` +
                  (student.admitCardToken ? `?t=${student.admitCardToken}` : "")
                }
                className="rounded-md bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark"
              >
                Download admit card (PDF) →
              </a>
              <Link
                href="/"
                className="rounded-md border border-brand-border bg-white px-5 py-2.5 text-sm font-medium hover:bg-brand-bg"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

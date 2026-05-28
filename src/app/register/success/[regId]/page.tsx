import Link from "next/link";
import { notFound } from "next/navigation";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ regId: string }>;
  searchParams: Promise<{ t?: string }>;
};

// Constant-time compare to avoid timing side-channels when a no-token URL
// is brute-forced.
function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export default async function SuccessPage({ params, searchParams }: PageProps) {
  const { regId } = await params;
  const { t } = await searchParams;
  const provided = t ?? "";

  const student = await prisma.student.findUnique({
    where: { registrationId: regId },
    include: { token: true },
  });
  if (!student || !student.token) notFound();

  // H2: gate the page on the per-student admit-card token. Without it,
  // /register/success/UU-AV-2026-0001 leaked full PII to anyone who could
  // guess a reg ID. Admins (logged-in staff) bypass for support purposes.
  const me = await getCurrentUser();
  const isStaff = !!me;
  const tokenOk =
    !!student.admitCardToken &&
    !!provided &&
    constantTimeEqual(provided, student.admitCardToken);

  if (!isStaff && !tokenOk) {
    // 404 (not 401/403) so attackers can't enumerate which reg IDs exist.
    notFound();
  }

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
            <div className="border-r border-brand-border p-8 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                Your token number
              </p>
              <p className="mt-3 text-[9rem] sm:text-[11rem] font-extrabold text-brand-green tabular-nums leading-none tracking-tight">
                #{student.token.tokenNumber}
              </p>
              <p className="mt-2 text-xs text-brand-muted">
                Remember this number. Watch the display screen at the venue.
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

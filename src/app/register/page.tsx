import { RegistrationFlow } from "./RegistrationFlow";
import { DRIVE_OPEN, DRIVE_CLOSED_INFO } from "@/lib/drive-gate";

export const dynamic = "force-dynamic";
// Submitting includes file uploads to Supabase Storage + DB transaction +
// email send. Bump from the default 15s so slow networks have headroom.
export const maxDuration = 60;

export const metadata = {
  title: DRIVE_OPEN
    ? "Student Registration - EWS Aviation Recruitment"
    : "Applications Closed - Elite World Services",
};

export default function RegisterPage() {
  // DRIVE-GATE: registration is closed by default. Flip env APP_DRIVE_OPEN
  // to reopen for the next drive (see src/lib/drive-gate.ts). The server
  // actions enforce the same flag, so this page is UX, not the security line.
  if (!DRIVE_OPEN) return <RegistrationClosed />;

  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-2xl px-6">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-brand-muted">
            EWS Aviation Recruitment 2026
          </p>
          <h1 className="mt-1 text-3xl font-bold text-brand-text">
            Student Registration
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            One-time registration. Takes ~3 minutes. You&apos;ll receive a token
            number and digital admit card by email.
          </p>
        </header>
        <RegistrationFlow />
      </div>
    </main>
  );
}

function RegistrationClosed() {
  return (
    <main className="flex-1 flex items-center justify-center py-20 px-6">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-navy/10">
          <svg
            className="h-8 w-8 text-brand-navy"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-brand-text">
          Registration is now closed
        </h1>
        <p className="mt-3 text-brand-muted leading-relaxed">
          The campus recruitment drive concluded on{" "}
          <strong>{DRIVE_CLOSED_INFO.endedOn}</strong>. We are no longer
          accepting new registrations for this cycle.
        </p>
        <p className="mt-4 text-brand-muted leading-relaxed">
          The next drive will be announced through your placement cell. For
          urgent queries, reach us at{" "}
          <a
            href={`mailto:${DRIVE_CLOSED_INFO.contact}`}
            className="font-medium text-brand-green hover:underline"
          >
            {DRIVE_CLOSED_INFO.contact}
          </a>
          .
        </p>

        {/* Already registered? */}
        <div className="mt-8 rounded-xl border border-brand-border bg-white p-5">
          <p className="text-sm font-medium text-brand-text">
            Already registered?
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            If you signed up before the deadline, log in to access your
            dashboard and study materials.
          </p>
          <a
            href="/intern/login"
            className="mt-4 inline-flex items-center rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy/90 transition-colors"
          >
            Log in to portal →
          </a>
        </div>
      </div>
    </main>
  );
}

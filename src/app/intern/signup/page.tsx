export const dynamic = "force-dynamic";

export const metadata = {
  title: "Applications Closed - Elite World Services",
};

// DRIVE-GATE: UU campus drive ended 29 May 2026.
// To reopen for the next drive, remove this file's contents and restore
// the InternSignupFlow import + page below.
export default function InternSignupPage() {
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
          Applications are now closed
        </h1>
        <p className="mt-3 text-brand-muted leading-relaxed">
          The campus recruitment drive concluded on{" "}
          <strong>29 May 2026</strong>. We are no longer accepting new
          applications for this cycle.
        </p>
        <p className="mt-4 text-brand-muted leading-relaxed">
          The next drive will be announced through your placement cell.
          For urgent queries, reach us at{" "}
          <a
            href="mailto:careers@ews.aero"
            className="font-medium text-brand-green hover:underline"
          >
            careers@ews.aero
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

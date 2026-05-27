import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-blue text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="flex items-center gap-3 text-sm uppercase tracking-widest text-white/70">
            <span className="inline-block h-px w-8 bg-brand-green" />
            Powered by Elite World Services
          </div>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            Uttaranchal University
            <br />
            <span className="text-brand-green">Aviation Recruitment 2026</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85">
            Official campus drive portal. Register with your university email,
            receive your interview token, and meet recruiters from India&apos;s
            leading airport service partners — all in one day.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-md bg-brand-green px-6 py-3 font-semibold text-white shadow-lg shadow-brand-green/30 transition hover:bg-brand-green-dark"
            >
              Register as Student →
            </Link>
            <Link
              href="/admin"
              className="rounded-md border border-white/30 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-brand-text">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              n: "1",
              title: "Register",
              body: "Scan the QR at the registration desk, verify your email with a one-time code, and fill the recruitment form.",
            },
            {
              n: "2",
              title: "Receive token",
              body: "Get a unique token number and a digital admit card. Wait for your number on the live display screen.",
            },
            {
              n: "3",
              title: "Interview",
              body: "Meet the recruiter in your allotted room. Decisions are communicated by email within 24 hours.",
            },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-lg border border-brand-border bg-brand-surface p-6 shadow-sm"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy text-white font-semibold">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-brand-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-brand-border bg-brand-surface py-8 text-center text-sm text-brand-muted">
        <p>
          © 2026 Elite World Services · Aviation Recruitment Platform · v0.1
        </p>
      </footer>
    </main>
  );
}

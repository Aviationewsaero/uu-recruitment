// Public landing page for careers.ews.aero - the EWS aviation careers HQ.
// Replaces the older UU-specific landing. Search-engine indexable.
// Sections (top-down): hero -> stats bar -> active drives -> internship -> direct apply
// -> partner with us -> about EWS -> footer.

import type { Metadata } from "next";
import Link from "next/link";
import { DirectApplyForm } from "./DirectApplyForm";

export const metadata: Metadata = {
  title: "Aviation Careers across India",
  description:
    "Apply for aviation careers at 67+ Indian airports. Direct hiring, paid internships, and university recruitment partnerships through Elite World Services Limited.",
  openGraph: {
    title: "EWS Aviation Careers · Across India's airport network",
    description:
      "Aviation careers across India. Direct hiring, paid internships, campus drives.",
    url: "https://careers.ews.aero",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-blue text-white">
        <Nav />
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/70">
            <span className="inline-block h-px w-10 bg-brand-green" />
            Elite World Services Limited · Aviation
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Aviation careers across{" "}
            <span className="text-brand-green">India&apos;s airport network</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
            EWS partners with India&apos;s leading airport ground-services
            operators, universities, and corporates to channel aviation talent
            into operational roles at 67 airports — with 5 more in active
            onboarding.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#apply"
              className="rounded-md bg-brand-green px-6 py-3 font-semibold text-white shadow-lg shadow-brand-green/30 transition hover:bg-brand-green-dark"
            >
              Apply directly →
            </a>
            <a
              href="#drives"
              className="rounded-md border border-white/30 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              View active drives
            </a>
            <a
              href="#partner"
              className="rounded-md border border-white/10 px-6 py-3 font-medium text-white/80 transition hover:bg-white/5"
            >
              For universities & corporates
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10 bg-black/10">
          <div className="mx-auto max-w-6xl px-6 py-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat label="Active airports" value="67" />
            <Stat label="Onboarding" value="+5" />
            <Stat label="Pan-India presence" value="✓" />
            <Stat label="Partner-led" value="Aggregator model" textValue />
          </div>
        </div>
      </section>

      {/* ─── ACTIVE DRIVES ─────────────────────────────────────────────── */}
      <section id="drives" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <SectionHeader
          eyebrow="Active campaigns"
          title="Current recruitment drives"
          subtitle="Live and concluded recruitment partnerships with universities and corporates."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <DriveCard
            kicker="University campus drive"
            title="UU Aviation Recruitment 2026"
            status="concluded"
            statusLabel="Drive concluded · Results published"
            description="Recruitment drive held on 29 May 2026 at Uttaranchal University, Dehradun. Shortlisted candidates progress to the Paid Internship-cum-Placement Programme (BBA Aviation) or second-round evaluation (other streams)."
            ctaLabel="Drive closed"
            ctaHref="#drives"
          />
          <DriveCard
            kicker="Coming soon"
            title="More university partnerships"
            status="upcoming"
            statusLabel="Onboarding"
            description="EWS is actively onboarding aviation, hospitality, and engineering programmes from universities across North India for 2026-27 intake. Reach out to set up a campus drive at your institution."
            ctaLabel="Partner with EWS →"
            ctaHref="#partner"
          />
        </div>
      </section>

      {/* ─── PAID INTERNSHIP ───────────────────────────────────────────── */}
      <section className="bg-brand-bg py-16 sm:py-20 border-y border-brand-border">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="Paid Internship Programme"
            title="Get airport-floor experience. Get paid for it."
            subtitle="A structured internship programme for aviation, hospitality, and engineering students."
          />
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <FeatureRow
                title="Structured 4–12 week placement"
                body="Real on-the-floor exposure at one of EWS's partner airports: passenger Meet & Assist, lounge operations, terminal services, customer-experience desks."
              />
              <FeatureRow
                title="Monthly stipend"
                body="Paid stipend communicated per intake batch in the Internship Offer Letter — set by role, host location, and operational considerations."
              />
              <FeatureRow
                title="Dedicated industry mentor"
                body="Each intern is paired with an EWS mentor and a host-airport point-of-contact for the duration of the programme."
              />
              <FeatureRow
                title="Open to multiple courses"
                body="BBA Aviation, MBA Aviation, B.Sc Aviation, B-Tech / M-Tech (Aeronautical & allied), and other aviation-relevant programmes."
              />
            </div>
            <aside className="rounded-xl border-2 border-brand-green/40 bg-brand-green/5 p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-green-dark">
                Apply to the Programme
              </p>
              <h3 className="mt-2 text-2xl font-bold text-brand-text">
                Write to us with your details
              </h3>
              <p className="mt-3 text-sm text-brand-text leading-relaxed">
                Send the following to{" "}
                <a href="mailto:aviation@ews.aero" className="text-brand-blue font-semibold hover:underline">
                  aviation@ews.aero
                </a>
                :
              </p>
              <ul className="mt-3 text-sm text-brand-text space-y-1.5 list-disc pl-5">
                <li>Full name (as registered)</li>
                <li>Registration ID (if from a partner university)</li>
                <li>Mobile number + alternate contact</li>
                <li>Course, semester, university</li>
                <li>Preferred airport region (indicative)</li>
              </ul>
              <p className="mt-4 text-xs text-brand-muted leading-relaxed">
                Inclusion in any intake remains at EWS&apos;s discretion based on
                programme intake limits and partner-airport requirements for the
                relevant period.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── DIRECT APPLY ──────────────────────────────────────────────── */}
      <section id="apply" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <SectionHeader
          eyebrow="Direct hiring"
          title="Apply directly to EWS"
          subtitle="Looking for an aviation role outside a university drive? Submit your details and our recruitment team will reach out within 48 hours."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6 text-sm text-brand-text leading-relaxed">
            <div>
              <h3 className="text-base font-bold text-brand-navy">
                What we hire for
              </h3>
              <ul className="mt-2 space-y-1.5">
                <li>· Ground staff & passenger handling</li>
                <li>· Lounge & hospitality services</li>
                <li>· Customer-experience desks</li>
                <li>· Supervisors & team leads</li>
                <li>· Airport-region operational coordinators</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-navy">
                Where you might be placed
              </h3>
              <p className="mt-2">
                Across the 67 airports where EWS&apos;s partner operators run
                ground services — including Delhi, Mumbai, Bengaluru, Hyderabad,
                Chennai, Kolkata, Pune, and 60+ tier-2 / tier-3 airports.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-navy">
                What happens next
              </h3>
              <p className="mt-2">
                Our recruitment team triages every application within 48 hours.
                If your profile matches an active opening, we&apos;ll set up an
                introductory call, followed by a role-fit interview with the
                relevant partner operator.
              </p>
            </div>
          </div>
          <DirectApplyForm />
        </div>
      </section>

      {/* ─── FOR PARTNERS ──────────────────────────────────────────────── */}
      <section id="partner" className="bg-brand-navy text-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="For universities & corporates"
            title="Partner with EWS for hiring"
            subtitle="We run end-to-end campus drives and structured corporate recruitment partnerships, with a digital infrastructure that scales from 100 to 1,000+ candidates per drive."
            inverse
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <PartnerCard
              n="01"
              title="Campus drives"
              body="Single-day drives at your campus. EWS handles registration, interview tokens, recruiter rooms, and same-day result publication."
            />
            <PartnerCard
              n="02"
              title="Corporate partnerships"
              body="Co-branded recruitment pipelines feeding into your operational manpower planning. Suitable for ground-services operators, lounge groups, and airport concessionaires."
            />
            <PartnerCard
              n="03"
              title="Internship programmes"
              body="Structured paid-internship channels that align academic calendars with airport operational intake windows."
            />
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="mailto:aviation@ews.aero?subject=Partnership%20enquiry%20-%20careers.ews.aero"
              className="rounded-md bg-brand-green px-6 py-3 font-semibold text-white shadow-lg shadow-brand-green/30 transition hover:bg-brand-green-dark"
            >
              Email us to set up a partnership →
            </a>
            <span className="text-sm text-white/70 self-center">
              We typically respond within 2 business days.
            </span>
          </div>
        </div>
      </section>

      {/* ─── ABOUT EWS ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <SectionHeader
          eyebrow="About"
          title="Elite World Services Limited"
          subtitle="An aggregator model for India's airport ground services."
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-[2fr_1fr] text-sm text-brand-text leading-relaxed">
          <div className="space-y-4">
            <p>
              Elite World Services Limited is an India-based aviation
              services aggregator. Rather than operating its own ground-services
              brand at each airport, EWS works alongside established partner
              operators — including Encalm, Pranam, and others — to channel
              talent, training, and operational capacity into customer-facing
              airport roles across India.
            </p>
            <p>
              The model lets EWS scale faster than any single operator could on
              its own, while giving universities and direct candidates a single,
              consistent point of contact for aviation careers regardless of
              which airport or operator a placement eventually lands at.
            </p>
            <p>
              EWS is actively expanding from 67 active airports to 72 over the
              coming months, with university recruitment partnerships
              constituting the primary intake channel for new operational
              talent.
            </p>
          </div>
          <aside className="rounded-xl border border-brand-border bg-brand-bg p-6 space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                Headquartered
              </p>
              <p className="text-brand-text font-medium mt-1">New Delhi, India</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                Operational presence
              </p>
              <p className="text-brand-text font-medium mt-1">
                67 airports across India · 5 onboarding
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                Recruitment contact
              </p>
              <p className="text-brand-text font-medium mt-1">
                <a
                  href="mailto:aviation@ews.aero"
                  className="text-brand-blue hover:underline"
                >
                  aviation@ews.aero
                </a>
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ─── PORTAL ACCESS ─────────────────────────────────────────────── */}
      <section id="portal" className="bg-brand-bg border-y border-brand-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="Portal Access"
            title="Sign in to your portal"
            subtitle="Choose your role to access the right dashboard."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <Link
              href="/admin/login"
              className="group rounded-xl border-2 border-brand-border bg-brand-surface p-6 hover:border-brand-navy hover:shadow-md transition flex flex-col gap-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy/10 text-brand-navy text-2xl">
                🛡️
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">Admin</p>
                <h3 className="mt-1 text-xl font-bold text-brand-text group-hover:text-brand-navy">Admin Portal</h3>
                <p className="mt-2 text-sm text-brand-muted leading-relaxed">
                  Manage interns, approve applications, upload study materials, and oversee the full programme.
                </p>
              </div>
              <span className="mt-auto text-sm font-semibold text-brand-navy group-hover:underline">
                Admin sign in →
              </span>
            </Link>

            <Link
              href="/admin/login"
              className="group rounded-xl border-2 border-brand-border bg-brand-surface p-6 hover:border-brand-blue hover:shadow-md transition flex flex-col gap-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue text-2xl">
                👤
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">Staff</p>
                <h3 className="mt-1 text-xl font-bold text-brand-text group-hover:text-brand-blue">Staff Portal</h3>
                <p className="mt-2 text-sm text-brand-muted leading-relaxed">
                  Recruiters and desk operators — access your recruitment dashboard, interview rooms, and live queue.
                </p>
              </div>
              <span className="mt-auto text-sm font-semibold text-brand-blue group-hover:underline">
                Staff sign in →
              </span>
            </Link>

            <Link
              href="/intern/login"
              className="group rounded-xl border-2 border-brand-border bg-brand-surface p-6 hover:border-brand-green-dark hover:shadow-md transition flex flex-col gap-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-brand-green-dark text-2xl">
                🎓
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">Intern</p>
                <h3 className="mt-1 text-xl font-bold text-brand-text group-hover:text-brand-green-dark">Intern Portal</h3>
                <p className="mt-2 text-sm text-brand-muted leading-relaxed">
                  Access your study materials, track attendance, take notes, and manage your internship profile.
                </p>
              </div>
              <span className="mt-auto text-sm font-semibold text-brand-green-dark group-hover:underline">
                Intern sign in →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-border bg-brand-surface">
        <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">
              Elite World Services Limited
            </p>
            <p className="mt-2 text-brand-text">
              Aviation careers across India&apos;s airport network.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">
              Careers
            </p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a href="#drives" className="text-brand-text hover:text-brand-blue">
                  Active drives
                </a>
              </li>
              <li>
                <a href="#apply" className="text-brand-text hover:text-brand-blue">
                  Apply directly
                </a>
              </li>
              <li>
                <a
                  href="mailto:aviation@ews.aero"
                  className="text-brand-text hover:text-brand-blue"
                >
                  Internship programme
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">
              Partner
            </p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a
                  href="mailto:aviation@ews.aero?subject=University%20partnership"
                  className="text-brand-text hover:text-brand-blue"
                >
                  Universities
                </a>
              </li>
              <li>
                <a
                  href="mailto:aviation@ews.aero?subject=Corporate%20partnership"
                  className="text-brand-text hover:text-brand-blue"
                >
                  Corporates
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">
              Contact
            </p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a
                  href="mailto:aviation@ews.aero"
                  className="text-brand-text hover:text-brand-blue"
                >
                  aviation@ews.aero
                </a>
              </li>
              <li>
                <Link href="/admin/login" className="text-brand-muted text-xs hover:text-brand-blue">
                  Staff sign-in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-border">
          <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-brand-muted flex flex-wrap items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} Elite World Services Limited · All rights reserved.</p>
            <p>careers.ews.aero</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-green" />
          <span className="text-sm font-bold tracking-wider">EWS · CAREERS</span>
        </Link>
        <div className="flex items-center gap-5 text-sm text-white/80">
          <a href="#drives" className="hidden sm:block hover:text-white">Drives</a>
          <a href="#apply" className="hidden sm:block hover:text-white">Apply</a>
          <a href="#partner" className="hidden sm:block hover:text-white">Partner</a>
          <a
            href="#portal"
            className="rounded-md bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/20 transition"
          >
            Sign In →
          </a>
        </div>
      </div>
    </nav>
  );
}

function Stat({
  label,
  value,
  textValue,
}: {
  label: string;
  value: string;
  textValue?: boolean;
}) {
  return (
    <div>
      <p
        className={`font-extrabold tabular-nums leading-none ${
          textValue ? "text-lg sm:text-xl" : "text-3xl sm:text-4xl"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-widest text-white/60">
        {label}
      </p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  inverse,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  inverse?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p
        className={`text-xs font-bold uppercase tracking-[0.25em] ${
          inverse ? "text-brand-green" : "text-brand-green-dark"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-3xl sm:text-4xl font-bold leading-tight ${
          inverse ? "text-white" : "text-brand-text"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-base sm:text-lg ${
            inverse ? "text-white/80" : "text-brand-muted"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function DriveCard({
  kicker,
  title,
  status,
  statusLabel,
  description,
  ctaLabel,
  ctaHref,
}: {
  kicker: string;
  title: string;
  status: "live" | "concluded" | "upcoming";
  statusLabel: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const pill = {
    live: "bg-brand-green/15 text-brand-green-dark",
    concluded: "bg-brand-blue/15 text-brand-blue",
    upcoming: "bg-amber-100 text-amber-800",
  }[status];
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-6 transition hover:shadow-md flex flex-col">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
        {kicker}
      </p>
      <h3 className="mt-2 text-xl sm:text-2xl font-bold text-brand-text">
        {title}
      </h3>
      <span
        className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${pill}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {statusLabel}
      </span>
      <p className="mt-4 text-sm text-brand-text leading-relaxed flex-1">
        {description}
      </p>
      <a
        href={ctaHref}
        className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-blue hover:underline"
      >
        {ctaLabel}
      </a>
    </div>
  );
}

function FeatureRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-brand-green-dark text-sm font-bold">
        ✓
      </div>
      <div>
        <h4 className="text-base font-semibold text-brand-text">{title}</h4>
        <p className="mt-1 text-sm text-brand-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function PartnerCard({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur">
      <p className="text-xs font-bold tracking-widest text-brand-green">{n}</p>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-white/80 leading-relaxed">{body}</p>
    </div>
  );
}

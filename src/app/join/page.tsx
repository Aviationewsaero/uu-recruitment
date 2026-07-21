import type { Metadata } from "next";
import { DirectApplyForm } from "../DirectApplyForm";

export const metadata: Metadata = {
  title: "Join our Talent Network — Elite World Services",
  description:
    "Register your interest for aviation roles across EWS partner operators. We'll email you when a matching opening comes up.",
};

// The talent-network sign-up — the "front door" of the talent ecosystem. Unlike the
// direct-apply form (which is for a specific opening), this invites people to register
// for FUTURE openings. Same intake, tagged source=TALENT_NETWORK.
export default function JoinTalentNetworkPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue">
            Talent network
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">
            Join our talent network
          </h1>
          <p className="mt-3 text-brand-text">
            Register your details once and we&apos;ll reach out when an aviation role that
            fits you opens up — across the airports where EWS&apos;s partner operators run
            ground services. No specific opening required; you&apos;re signing up to be
            considered for future ones.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6 text-sm text-brand-text leading-relaxed">
            <div>
              <h3 className="text-base font-bold text-brand-navy">Roles we hire for</h3>
              <ul className="mt-2 space-y-1.5">
                <li>· Ground staff &amp; passenger handling</li>
                <li>· Lounge &amp; hospitality services</li>
                <li>· Customer-experience desks</li>
                <li>· Supervisors &amp; team leads</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-navy">Why join</h3>
              <p className="mt-2">
                One registration keeps you on our radar for every future opening. When a
                role matches your profile, you&apos;ll be among the first we email — just
                reply with your updated CV to be considered.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-navy">Your details are safe</h3>
              <p className="mt-2">
                Stored under the Digital Personal Data Protection Act, 2023, and shared only
                with EWS&apos;s airport partner operators when a role matches.
              </p>
            </div>
          </div>

          <DirectApplyForm variant="network" />
        </div>
      </section>
    </main>
  );
}

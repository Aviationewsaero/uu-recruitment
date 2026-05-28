// Super-admin-only diagnostic page for the email pipeline.
// Surfaces the EXACT runtime env values + sends a real test email through
// the same code path students hit. Use this whenever a student says
// "I didn't get my email" — one click tells you precisely what's wrong.

import { requireRole } from "@/lib/auth-user";
import { env } from "@/lib/env";
import { TestEmailButton } from "./TestEmailButton";

export const dynamic = "force-dynamic";

export default async function EmailTestPage() {
  const me = await requireRole("SUPER_ADMIN");

  // Snapshot the env values the app is ACTUALLY using right now.
  const mode = env.EMAIL_MODE;
  const from = env.EMAIL_FROM;
  const replyTo = env.EMAIL_REPLY_TO;
  const apiKey = env.RESEND_API_KEY;
  const apiKeyDisplay = apiKey
    ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}  (${apiKey.length} chars)`
    : "❌ NOT SET";
  const appUrl = env.APP_URL;

  const modeOk = mode === "resend";
  const apiOk = apiKey.length > 10;
  const fromOk = from.includes("@");

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Email diagnostic</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Live snapshot of the email config + one-click send test. Use this to
          debug missing-email reports without poking around in Vercel.
        </p>
      </header>

      <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-muted">
          Runtime configuration
        </h2>
        <dl className="mt-4 grid grid-cols-[180px_1fr] gap-y-3 gap-x-4 text-sm">
          <dt className="font-semibold text-brand-text">APP_EMAIL_MODE</dt>
          <dd className="font-mono">
            <span className={modeOk ? "text-brand-green-dark" : "text-red-700"}>
              {modeOk ? "✅" : "❌"} &quot;{mode}&quot;
            </span>
            {!modeOk && (
              <span className="ml-2 text-xs text-red-700">
                must equal &quot;resend&quot; for production sends
              </span>
            )}
          </dd>

          <dt className="font-semibold text-brand-text">RESEND_API_KEY</dt>
          <dd className="font-mono">
            <span className={apiOk ? "text-brand-green-dark" : "text-red-700"}>
              {apiOk ? "✅" : "❌"} {apiKeyDisplay}
            </span>
          </dd>

          <dt className="font-semibold text-brand-text">EMAIL_FROM</dt>
          <dd className="font-mono break-all">
            <span className={fromOk ? "text-brand-green-dark" : "text-red-700"}>
              {fromOk ? "✅" : "❌"} {from || "<empty>"}
            </span>
          </dd>

          <dt className="font-semibold text-brand-text">EMAIL_REPLY_TO</dt>
          <dd className="font-mono break-all text-brand-text">
            {replyTo || <span className="text-brand-muted">&lt;empty&gt;</span>}
          </dd>

          <dt className="font-semibold text-brand-text">APP_URL</dt>
          <dd className="font-mono break-all text-brand-text">{appUrl}</dd>

          <dt className="font-semibold text-brand-text">Logged in as</dt>
          <dd className="font-mono text-brand-text">{me.email}</dd>
        </dl>
      </section>

      <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-muted">
          Send test email
        </h2>
        <p className="mt-2 text-sm text-brand-muted">
          Runs through the SAME sendEmail() function students hit, then shows
          you the literal Resend response (success id OR exact error message).
        </p>
        <div className="mt-4">
          <TestEmailButton defaultEmail={me.email} />
        </div>
      </section>

      <section className="rounded-lg border border-brand-border bg-brand-bg p-6 text-sm">
        <h3 className="font-semibold text-brand-text">
          Reading the results
        </h3>
        <ul className="mt-2 space-y-1.5 text-brand-text">
          <li>
            <strong>All three ✅ above + Resend test returns an id</strong> →
            email pipeline is healthy. If a student still didn&apos;t get
            theirs, check their spam folder or domain bounce list.
          </li>
          <li>
            <strong>APP_EMAIL_MODE is anything other than &quot;resend&quot;</strong>
             → emails are silently routed to the console (logged but never
            sent). Set <code>APP_EMAIL_MODE=resend</code> on Vercel and
            redeploy.
          </li>
          <li>
            <strong>RESEND_API_KEY shows ❌ or wrong length</strong> →
            secret missing or truncated. Paste fresh from Resend dashboard
            into Vercel env.
          </li>
          <li>
            <strong>Resend error mentions &quot;domain not verified&quot;</strong>
             → DNS records for ews.aero not green in Resend dashboard.
            Fix DNS at Hostinger.
          </li>
        </ul>
      </section>
    </div>
  );
}

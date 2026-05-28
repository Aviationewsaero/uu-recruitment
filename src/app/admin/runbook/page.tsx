// Printable single-page operator runbook for drive day.
// /admin/runbook → File > Print → fits one A4 page.

import { requireRole } from "@/lib/auth-user";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function RunbookPage() {
  await requireRole("SUPER_ADMIN", "DESK_OPERATOR");

  return (
    <div className="bg-white p-8 max-w-3xl mx-auto print:p-0 print:max-w-none">
      {/* Print button (hidden when printing) */}
      <div className="no-print mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-brand-text">
          Drive-day operator runbook
        </h1>
        <PrintButton />
      </div>

      <article className="print-runbook border border-brand-border rounded-lg p-8 bg-white print:border-0 print:p-0">
        <header className="pb-4 border-b-2 border-brand-navy">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-muted">
                Elite World Services
              </p>
              <h2 className="text-2xl font-bold text-brand-navy">
                Drive-day operator runbook
              </h2>
            </div>
            <p className="text-xs text-brand-muted">
              UU Aviation Recruitment 2026
            </p>
          </div>
        </header>

        <section className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand-green">
            Before the drive opens
          </h3>
          <ul className="mt-2 text-sm space-y-1.5">
            <li>
              <strong>Check display board:</strong> open{" "}
              <code>/display</code> on the waiting-area TV in full-screen
              browser (F11).
            </li>
            <li>
              <strong>Open recruiter view:</strong> each recruiter logs into{" "}
              <code>/admin/login</code> with their EWS email, sees their room
              auto-assigned.
            </li>
            <li>
              <strong>Sanity check:</strong> visit <code>/admin</code> and
              confirm the live tiles update as the first few tokens issue.
            </li>
          </ul>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand-green">
            Common scenarios
          </h3>
          <table className="mt-2 w-full text-sm border-collapse">
            <tbody>
              <Row
                problem="Student doesn't show when called"
                action="Recruiter clicks Skip (no-show) → token becomes SKIPPED. Desk operator can Recall later from /admin/queue."
              />
              <Row
                problem="Recruiter wants to recall a skipped student"
                action="/admin/queue → filter chip 'Skipped' → click Recall on the row. Token returns to top of WAITING queue."
              />
              <Row
                problem="Student typo'd their email"
                action="Desk operator: ask them to re-register with correct email. The old (unverified) record stays in DB but is ignored."
              />
              <Row
                problem="Display board frozen"
                action="Refresh the TV browser (Cmd+R / Ctrl+R). Auto-refresh resumes every 3 sec."
              />
              <Row
                problem="Want to send announcement to everyone selected"
                action="/admin/emails → Status: Selected → Preview audience → write subject + body → Send."
              />
              <Row
                problem="Recruiter's queue says 'no room assigned'"
                action="Super admin needs to assign them via DB (Day 3 seed) or via /admin/users (post-MVP). Until then: log them in as another recruiter."
              />
              <Row
                problem="Need a copy of all students mid-drive"
                action="/admin/students → 'Export CSV' button (top right). Download includes all current filters."
              />
            </tbody>
          </table>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand-green">
            Emergencies
          </h3>
          <table className="mt-2 w-full text-sm border-collapse">
            <tbody>
              <Row
                problem="Site is down (500 errors everywhere)"
                action="Check Vercel dashboard → Deployments → last green deployment → 'Promote to production'. If still down: check Supabase status page."
              />
              <Row
                problem="Database connection errors"
                action="Supabase project may have paused (free tier). Log in → Resume project. Or: check connection limit hasn't been exceeded."
              />
              <Row
                problem="No emails arriving"
                action="Resend dashboard → check delivery + bounce logs. Free tier limit is 100/day, 3000/month — check usage. Verify DNS still green."
              />
              <Row
                problem="Critical bug found"
                action="Roll back: Vercel → Deployments → previous green build → 'Promote to production'. Then call dev to investigate."
              />
            </tbody>
          </table>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand-green">
            Contacts
          </h3>
          <p className="mt-2 text-sm">
            <strong>Aviation lead:</strong> aviation@ews.aero ·{" "}
            <strong>Vercel:</strong> dashboard.vercel.com ·{" "}
            <strong>Supabase:</strong> supabase.com/dashboard
          </p>
        </section>

        <footer className="mt-6 pt-3 border-t border-brand-border text-xs text-brand-muted text-center">
          Printed from /admin/runbook on{" "}
          {new Date().toLocaleString("en-IN")} · Keep at desk
        </footer>
      </article>
    </div>
  );
}

function Row({ problem, action }: { problem: string; action: string }) {
  return (
    <tr className="border-b border-brand-border last:border-0">
      <td className="py-2 pr-3 align-top font-semibold w-2/5">
        {problem}
      </td>
      <td className="py-2 pl-3 align-top text-brand-muted">{action}</td>
    </tr>
  );
}

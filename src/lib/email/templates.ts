// Branded HTML email templates. Server-rendered strings - no React Email dep
// to keep the bundle small. Aviation navy header + green accent bar.

import { env } from "@/lib/env";

type Brand = { name: string; url: string };
const BRAND: Brand = { name: env.APP_NAME, url: env.APP_URL };

function shell(opts: { title: string; preview: string; bodyHtml: string }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>${opts.title}</title>
<style>
  body{margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;}
  .wrap{max-width:560px;margin:0 auto;background:#ffffff;}
  .hero{background:linear-gradient(135deg,#1e3a8a 0%,#172a5e 100%);padding:32px 28px;color:#fff;}
  .hero h1{margin:0;font-size:22px;font-weight:700;}
  .hero .tag{display:inline-block;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.7);padding-bottom:6px;}
  .accent{height:4px;background:#22c55e;}
  .body{padding:32px 28px;font-size:15px;line-height:1.6;}
  .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;}
  .label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;}
  .value{font-size:18px;font-weight:600;color:#1e3a8a;margin-top:4px;}
  .token{font-size:48px;font-weight:700;color:#22c55e;letter-spacing:-1px;margin:8px 0;}
  .btn{display:inline-block;background:#22c55e;color:#fff !important;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:12px;}
  .footer{padding:24px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;}
</style>
</head><body>
<div style="display:none;max-height:0;overflow:hidden;">${opts.preview}</div>
<div class="wrap">
  <div class="hero">
    <span class="tag">Elite World Services</span>
    <h1>${opts.title}</h1>
  </div>
  <div class="accent"></div>
  <div class="body">${opts.bodyHtml}</div>
  <div class="footer">
    © 2026 Elite World Services · ${BRAND.name}<br/>
    <a href="${BRAND.url}" style="color:#1e3a8a;">${BRAND.url.replace(/^https?:\/\//, "")}</a>
  </div>
</div>
</body></html>`;
}

// ----- Templates -----

export function registrationConfirmation(args: {
  fullName: string;
  registrationId: string;
  tokenNumber: number;
  admitCardUrl: string;
}) {
  const { fullName, registrationId, tokenNumber, admitCardUrl } = args;
  return {
    subject: `✈️ Registration confirmed - Token #${tokenNumber} · UU Aviation Recruitment`,
    html: shell({
      title: "Registration Confirmed",
      preview: `Your token is #${tokenNumber}. Download your admit card.`,
      bodyHtml: `
        <p>Hello <strong>${escape(fullName)}</strong>,</p>
        <p>Your registration for the Uttaranchal University Aviation Recruitment Drive is confirmed. Save this email - you'll need your token number on drive day.</p>
        <div class="card">
          <div class="label">Your token number</div>
          <div class="token">#${tokenNumber}</div>
          <div class="label" style="margin-top:16px;">Registration ID</div>
          <div class="value">${registrationId}</div>
        </div>
        <p><strong>What's next:</strong></p>
        <ul>
          <li>Download your digital admit card below - print it or save to your phone</li>
          <li>Arrive at the venue 30 minutes before your token is called</li>
          <li>Watch the live display board for your token number</li>
        </ul>
        <p><a class="btn" href="${admitCardUrl}">Download Admit Card →</a></p>
        <p style="margin-top:32px;color:#64748b;font-size:13px;">If you didn't register, please ignore this email.</p>
      `,
    }),
  };
}
function escape(s: string) {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
}

// ----- Decision emails (one per outcome) -----

type DecisionArgs = { fullName: string; tokenNumber: number; registrationId: string };

export function selectedEmail({ fullName, registrationId }: DecisionArgs) {
  return {
    subject: "🎉 Congratulations - You're selected (UU Aviation Recruitment)",
    html: shell({
      title: "You're selected!",
      preview: "Welcome aboard - next steps inside.",
      bodyHtml: `
        <p>Dear <strong>${escape(fullName)}</strong>,</p>
        <p>We are delighted to inform you that you have been <strong style="color:#22c55e;">SELECTED</strong> from the Uttaranchal University Aviation Recruitment Drive.</p>
        <div class="card">
          <div class="label">Reference</div>
          <div class="value">${registrationId}</div>
        </div>
        <p><strong>What happens next:</strong></p>
        <ul>
          <li>Our HR team will reach out within 3 working days with your offer letter</li>
          <li>Keep this email for your records - quote your reference ID in all correspondence</li>
          <li>For urgent questions: <a href="mailto:aviation@ews.aero">aviation@ews.aero</a></li>
        </ul>
        <p>Once again - welcome to Elite World Services. We're excited to have you on board.</p>
      `,
    }),
  };
}

export function shortlistedEmail({ fullName, registrationId }: DecisionArgs) {
  return {
    subject: "📋 You're shortlisted - UU Aviation Recruitment",
    html: shell({
      title: "You're shortlisted",
      preview: "Final decision in 5 working days.",
      bodyHtml: `
        <p>Dear <strong>${escape(fullName)}</strong>,</p>
        <p>Thank you for attending the recruitment drive. You have been <strong>shortlisted</strong> based on your interview.</p>
        <div class="card">
          <div class="label">Reference</div>
          <div class="value">${registrationId}</div>
        </div>
        <p>We will communicate the final decision within <strong>5 working days</strong>. Please keep an eye on your inbox (and spam folder, just in case).</p>
        <p>If you have urgent questions, reply to this email or write to <a href="mailto:aviation@ews.aero">aviation@ews.aero</a>.</p>
      `,
    }),
  };
}

export function holdEmail({ fullName, registrationId }: DecisionArgs) {
  return {
    subject: "Your interview status - on hold (UU Aviation Recruitment)",
    html: shell({
      title: "On hold",
      preview: "Decision pending review - we'll update you soon.",
      bodyHtml: `
        <p>Dear <strong>${escape(fullName)}</strong>,</p>
        <p>Thank you for attending the recruitment drive. Your candidature is currently <strong>on hold</strong> pending further review by our hiring team.</p>
        <div class="card">
          <div class="label">Reference</div>
          <div class="value">${registrationId}</div>
        </div>
        <p>We'll communicate an update within 7 working days. No action needed from your side right now.</p>
        <p>Questions? <a href="mailto:aviation@ews.aero">aviation@ews.aero</a></p>
      `,
    }),
  };
}

export function reInterviewEmail({ fullName, registrationId }: DecisionArgs) {
  return {
    subject: "Please come back for a second interview - UU Aviation",
    html: shell({
      title: "Second interview requested",
      preview: "We'd like to speak with you again.",
      bodyHtml: `
        <p>Dear <strong>${escape(fullName)}</strong>,</p>
        <p>Thanks for the first conversation. We'd like to invite you back for a <strong>second round interview</strong> to discuss a few topics in more depth.</p>
        <div class="card">
          <div class="label">Reference</div>
          <div class="value">${registrationId}</div>
        </div>
        <p>Please make yourself available at the venue at your earliest. Visit the desk and present this email + your admit card to be re-issued a token.</p>
        <p>Questions? <a href="mailto:aviation@ews.aero">aviation@ews.aero</a></p>
      `,
    }),
  };
}

export function rejectedEmail({ fullName, registrationId }: DecisionArgs) {
  return {
    subject: "Thank you for participating - UU Aviation Recruitment",
    html: shell({
      title: "Thank you for your time",
      preview: "We won't be moving forward this time.",
      bodyHtml: `
        <p>Dear <strong>${escape(fullName)}</strong>,</p>
        <p>Thank you for attending the recruitment drive and for the time you spent with our team.</p>
        <p>After careful consideration, we will not be moving forward with your application at this time. This decision in no way reflects on your ability - the competition was strong and we had limited positions to fill.</p>
        <div class="card">
          <div class="label">Reference</div>
          <div class="value">${registrationId}</div>
        </div>
        <p>We genuinely wish you the very best in your career. Please do consider us for future opportunities - we run multiple drives a year.</p>
      `,
    }),
  };
}

export function templateForDecision(
  decision:
    | "SELECTED"
    | "SHORTLISTED"
    | "HOLD"
    | "RE_INTERVIEW"
    | "REJECTED",
  args: DecisionArgs
) {
  switch (decision) {
    case "SELECTED":
      return selectedEmail(args);
    case "SHORTLISTED":
      return shortlistedEmail(args);
    case "HOLD":
      return holdEmail(args);
    case "RE_INTERVIEW":
      return reInterviewEmail(args);
    case "REJECTED":
      return rejectedEmail(args);
  }
}

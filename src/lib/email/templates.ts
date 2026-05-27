// Branded HTML email templates. Server-rendered strings — no React Email dep
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
    subject: `✈️ Registration confirmed — Token #${tokenNumber} · UU Aviation Recruitment`,
    html: shell({
      title: "Registration Confirmed",
      preview: `Your token is #${tokenNumber}. Download your admit card.`,
      bodyHtml: `
        <p>Hello <strong>${escape(fullName)}</strong>,</p>
        <p>Your registration for the Uttaranchal University Aviation Recruitment Drive is confirmed. Save this email — you'll need your token number on drive day.</p>
        <div class="card">
          <div class="label">Your token number</div>
          <div class="token">#${tokenNumber}</div>
          <div class="label" style="margin-top:16px;">Registration ID</div>
          <div class="value">${registrationId}</div>
        </div>
        <p><strong>What's next:</strong></p>
        <ul>
          <li>Download your digital admit card below — print it or save to your phone</li>
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

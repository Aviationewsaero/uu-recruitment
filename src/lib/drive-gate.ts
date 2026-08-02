// ─────────────────────────────────────────────────────────────────────────
// SINGLE SWITCH for the public campus-drive registration path (/register).
//
// The UU Aviation campus drive ended 29 May 2026. Registration is CLOSED by
// default: the /register page shows an "Applications closed" notice AND every
// registration server action refuses to run. Closing both layers stops:
//   • stray sign-ups long after the drive is over,
//   • PII (name, parents, phone, marks, resume, photo) collecting in prod,
//   • the email-enumeration oracle in requestOtpAction (which leaks whether
//     an email is already registered, plus its token number),
//   • scripted / replayed POSTs against the server action directly.
//
// TO REOPEN for the next drive (no logic redeploy needed):
//   1. Set env  APP_DRIVE_OPEN="true"  on Vercel and redeploy.
//   2. Restore the /register entry in  src/app/sitemap.ts  and remove the
//      /register block from  src/app/robots.ts  so Google can discover it.
// TO CLOSE AGAIN: remove APP_DRIVE_OPEN (or set anything but "true").
// ─────────────────────────────────────────────────────────────────────────

// Default CLOSED. Only the exact string "true" opens the path — an empty or
// missing env (Vercel sometimes stores empties) keeps it shut, fail-safe.
export const DRIVE_OPEN = process.env.APP_DRIVE_OPEN === "true";

export const DRIVE_CLOSED_INFO = {
  endedOn: "29 May 2026",
  contact: "aviation@ews.aero",
} as const;

// Uniform message returned by every gated server action when the drive is
// closed. Kept generic on purpose — no server internals, no hint about which
// emails exist.
export const DRIVE_CLOSED_MESSAGE = `Registration is closed. The drive concluded on ${DRIVE_CLOSED_INFO.endedOn}. For queries, contact ${DRIVE_CLOSED_INFO.contact}.`;

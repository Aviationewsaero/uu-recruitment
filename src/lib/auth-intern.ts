// Server-only helpers for guarding the /intern/* section.
//
// Unlike the staff guard (auth-user.ts) which just checks the cookie, the
// intern guard ALSO hits the DB to re-confirm the intern is still ACTIVE.
// This is intentional: admin needs to be able to deactivate an intern
// (compliance issue, internship ended) and have access cut off IMMEDIATELY,
// not at next cookie refresh. The DB lookup is one indexed PK query — cheap.

import { redirect } from "next/navigation";
import { getInternSession, type InternSessionPayload } from "@/lib/intern-session";
import { prisma } from "@/lib/prisma";
import type { Intern, InternshipPeriod } from "@/generated/prisma/client";
import type { InternStatus } from "@/generated/prisma/enums";

export type InternContext = {
  session: InternSessionPayload;
  intern: Intern & { period: InternshipPeriod | null };
};

/** Returns the session payload OR null. Does NOT redirect or DB-check. */
export async function getCurrentIntern(): Promise<InternSessionPayload | null> {
  return getInternSession();
}

/**
 * Returns the full intern (with period) if the cookie is valid AND the
 * intern is currently ACTIVE in the DB. Redirects to /intern/login otherwise.
 *
 * Use this on every protected /intern/* page.
 */
export async function requireActiveIntern(): Promise<InternContext> {
  const session = await getCurrentIntern();
  if (!session) redirect("/intern/login");

  const intern = await prisma.intern.findUnique({
    where: { id: session.internId },
    include: { period: true },
  });

  // Cookie valid but intern row gone, or status flipped — boot them.
  if (!intern || intern.status !== "ACTIVE") {
    redirect(
      `/intern/login?reason=${encodeURIComponent(reasonFromStatus(intern?.status))}`
    );
  }

  // Also enforce the internship-period window (defence in depth — a cron
  // also flips status to COMPLETED nightly, but this catches the gap).
  if (intern.period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (intern.period.endDate < today) {
      redirect("/intern/login?reason=internship_ended");
    }
  }

  return { session, intern };
}

/**
 * Variant that ALLOWS PENDING_VERIFICATION (used by the OTP-verify page).
 * Still requires a valid session cookie.
 */
export async function requireInternEvenIfUnverified(): Promise<InternContext> {
  const session = await getCurrentIntern();
  if (!session) redirect("/intern/login");

  const intern = await prisma.intern.findUnique({
    where: { id: session.internId },
    include: { period: true },
  });

  if (!intern) redirect("/intern/login?reason=not_found");
  if (intern.status === "INACTIVE" || intern.status === "TERMINATED") {
    redirect("/intern/login?reason=account_disabled");
  }

  return { session, intern };
}

function reasonFromStatus(status: InternStatus | null | undefined): string {
  switch (status) {
    case "PENDING_VERIFICATION":
      return "verify_email";
    case "INACTIVE":
      return "account_disabled";
    case "COMPLETED":
      return "internship_ended";
    case "TERMINATED":
      return "account_terminated";
    case "ACTIVE":
    case undefined:
    case null:
    default:
      return "session_expired";
  }
}

/** Human-friendly message for the reason query param shown on /intern/login. */
export function loginReasonMessage(reason: string | null | undefined): string | null {
  switch (reason) {
    case "verify_email":
      return "Please verify your email to continue. Check your inbox for the OTP.";
    case "account_disabled":
      return "Your account has been disabled. Please contact your EWS mentor.";
    case "account_terminated":
      return "Your access has been ended. Please contact your EWS mentor if this is unexpected.";
    case "internship_ended":
      return "Your internship period has ended. Materials are no longer accessible.";
    case "not_found":
      return "Account not found. Please sign up again.";
    case "session_expired":
      return "Your session expired. Please log in again.";
    default:
      return null;
  }
}

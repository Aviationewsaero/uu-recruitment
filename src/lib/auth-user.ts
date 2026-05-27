// Server-only helpers for checking the current logged-in user + role gates.
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";
import type { UserRole } from "@/generated/prisma/enums";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  return getSession();
}

export async function requireUser(): Promise<SessionPayload> {
  const u = await getCurrentUser();
  if (!u) redirect("/admin/login");
  return u;
}

export async function requireRole(
  ...allowed: UserRole[]
): Promise<SessionPayload> {
  const u = await requireUser();
  if (!allowed.includes(u.role)) redirect("/admin");
  return u;
}

// Default landing path per role
export function landingForRole(role: UserRole): string {
  switch (role) {
    case "RECRUITER":
      return "/recruiter";
    case "DESK_OPERATOR":
      return "/admin/queue";
    default:
      return "/admin";
  }
}

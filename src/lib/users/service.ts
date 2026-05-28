// User domain operations. Pure-ish — DB calls only, no Next.js, no HTTP.
// Server actions in actions.ts orchestrate and wrap these in auth checks.
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import type { UserRole } from "@/generated/prisma/enums";

export type StaffSummary = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  hasPassword: boolean;
  createdAt: Date;
};

export async function listStaff(): Promise<StaffSummary[]> {
  const rows = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { role: "asc" }, { fullName: "asc" }],
  });
  return rows.map((u) => ({
    id: u.id as string,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    active: u.active,
    hasPassword: Boolean(u.passwordHash),
    createdAt: u.createdAt,
  }));
}

export async function createStaff(input: {
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
}): Promise<{ id: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`A user with email ${email} already exists`);
  }
  const passwordHash = await hashPassword(input.password);
  const created = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      fullName: input.fullName.trim(),
      role: input.role,
      active: true,
      passwordHash,
    },
  });
  return { id: created.id as string };
}

export async function setStaffPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function setStaffActive(
  userId: string,
  active: boolean
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { active },
  });
}

export async function deleteStaff(userId: string): Promise<void> {
  // We don't hard-delete — rooms/audit/interview-logs reference this user.
  // Deactivate instead so historical data stays intact.
  await prisma.user.update({
    where: { id: userId },
    data: { active: false },
  });
}

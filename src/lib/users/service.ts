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
  // Only meaningful for RECRUITER rows — id+number of their assigned room,
  // null when nothing is wired up. Other roles always have null here.
  assignedRoomId: string | null;
  assignedRoomLabel: string | null;
};

export type RoomSummary = {
  id: string;
  roomNumber: string;
  displayName: string;
  recruiterId: string | null;
  recruiterName: string | null;
};

export async function listStaff(): Promise<StaffSummary[]> {
  const [users, rooms] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ active: "desc" }, { role: "asc" }, { fullName: "asc" }],
    }),
    prisma.room.findMany({
      select: {
        id: true,
        roomNumber: true,
        displayName: true,
        recruiterId: true,
      },
    }),
  ]);
  const roomByRecruiter = new Map(
    rooms
      .filter((r) => r.recruiterId)
      .map((r) => [r.recruiterId as string, r])
  );
  return users.map((u) => {
    const room = roomByRecruiter.get(u.id as string);
    return {
      id: u.id as string,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      active: u.active,
      hasPassword: Boolean(u.passwordHash),
      createdAt: u.createdAt,
      assignedRoomId: room?.id ?? null,
      assignedRoomLabel: room
        ? `${room.roomNumber} · ${room.displayName}`
        : null,
    };
  });
}

export async function listRooms(): Promise<RoomSummary[]> {
  const rooms = await prisma.room.findMany({
    orderBy: { roomNumber: "asc" },
    include: { recruiter: { select: { fullName: true } } },
  });
  return rooms.map((r) => ({
    id: r.id as string,
    roomNumber: r.roomNumber,
    displayName: r.displayName,
    recruiterId: (r.recruiterId as string | null) ?? null,
    recruiterName: r.recruiter?.fullName ?? null,
  }));
}

/**
 * Assign (or clear) the room for a recruiter. A recruiter has at most
 * one room and a room has at most one recruiter, so this is a two-step
 * transaction:
 *   1. Clear any room currently pointing at this user.
 *   2. Point the chosen room at the user (or leave cleared).
 */
export async function assignRoomToRecruiter(
  userId: string,
  roomId: string | null
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (txRaw: any) => {
    const tx = txRaw as typeof prisma;
    // Step 1: unlink any existing room from this recruiter.
    await tx.room.updateMany({
      where: { recruiterId: userId },
      data: { recruiterId: null },
    });
    if (!roomId) return;
    // Step 2: assign the new room. If that room was previously linked to
    // someone else, this overwrites — same as the desk-operator runbook
    // says ("Super admin reassigns via /admin/users").
    await tx.room.update({
      where: { id: roomId },
      data: { recruiterId: userId },
    });
  });
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

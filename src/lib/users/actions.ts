"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-user";
import { validatePasswordStrength } from "@/lib/auth/password";
import * as users from "./service";

const ROLES = ["SUPER_ADMIN", "RECRUITER", "DESK_OPERATOR", "EMAIL_MANAGER"] as const;

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  fullName: z.string().trim().min(2, "Name too short").max(120),
  role: z.enum(ROLES),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const idSchema = z.object({ userId: z.string().uuid() });

const passwordResetSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const activeSchema = z.object({
  userId: z.string().uuid(),
  active: z.coerce.boolean(),
});

const assignRoomSchema = z.object({
  userId: z.string().uuid(),
  // Empty string means "unassign"
  roomId: z.string().uuid().or(z.literal("")),
});

type Result =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function audit(actorId: string, action: string, target: string, payload?: unknown) {
  await prisma.auditLog
    .create({
      data: {
        actorId,
        action,
        target,
        payload: payload === undefined ? undefined : (payload as object),
      },
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[users] audit log write failed:", e);
    });
}

export async function createStaffAction(_prev: unknown, formData: FormData): Promise<Result> {
  const me = await requireRole("SUPER_ADMIN");
  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const strength = validatePasswordStrength(parsed.data.password);
  if (strength) return { ok: false, error: strength };

  try {
    const { id } = await users.createStaff(parsed.data);
    await audit(me.userId, "user.create", id, {
      email: parsed.data.email,
      role: parsed.data.role,
    });
    revalidatePath("/admin/users");
    return { ok: true, message: `Created ${parsed.data.email}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Create failed" };
  }
}

export async function resetStaffPasswordAction(
  _prev: unknown,
  formData: FormData
): Promise<Result> {
  const me = await requireRole("SUPER_ADMIN");
  const parsed = passwordResetSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const strength = validatePasswordStrength(parsed.data.password);
  if (strength) return { ok: false, error: strength };

  try {
    await users.setStaffPassword(parsed.data.userId, parsed.data.password);
    await audit(me.userId, "user.password_reset", parsed.data.userId);
    revalidatePath("/admin/users");
    return { ok: true, message: "Password updated" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reset failed" };
  }
}

export async function toggleStaffActiveAction(
  _prev: unknown,
  formData: FormData
): Promise<Result> {
  const me = await requireRole("SUPER_ADMIN");
  const parsed = activeSchema.safeParse({
    userId: formData.get("userId"),
    active: formData.get("active"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Safety: never let admin deactivate themselves
  if (parsed.data.userId === me.userId && !parsed.data.active) {
    return { ok: false, error: "You cannot deactivate yourself" };
  }
  try {
    await users.setStaffActive(parsed.data.userId, parsed.data.active);
    await audit(me.userId, parsed.data.active ? "user.activate" : "user.deactivate", parsed.data.userId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

export async function assignRoomAction(
  _prev: unknown,
  formData: FormData
): Promise<Result> {
  const me = await requireRole("SUPER_ADMIN");
  const parsed = assignRoomSchema.safeParse({
    userId: formData.get("userId"),
    roomId: formData.get("roomId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Only RECRUITER rows should be assignable — other roles don't own rooms.
  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true, email: true },
  });
  if (!user) return { ok: false, error: "User not found" };
  if (user.role !== "RECRUITER") {
    return { ok: false, error: "Only recruiters can be assigned a room" };
  }
  try {
    const roomId = parsed.data.roomId || null;
    await users.assignRoomToRecruiter(parsed.data.userId, roomId);
    await audit(me.userId, "user.room_assigned", parsed.data.userId, {
      roomId,
      email: user.email,
    });
    revalidatePath("/admin/users");
    revalidatePath("/recruiter");
    revalidatePath("/display");
    return {
      ok: true,
      message: roomId ? "Room assigned" : "Room unassigned",
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Assign failed" };
  }
}

export async function deleteStaffAction(_prev: unknown, formData: FormData): Promise<Result> {
  const me = await requireRole("SUPER_ADMIN");
  const parsed = idSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return { ok: false, error: "Invalid id" };
  if (parsed.data.userId === me.userId) {
    return { ok: false, error: "You cannot delete yourself" };
  }
  try {
    await users.deleteStaff(parsed.data.userId);
    await audit(me.userId, "user.delete", parsed.data.userId);
    revalidatePath("/admin/users");
    return { ok: true, message: "User deactivated" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed" };
  }
}

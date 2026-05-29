"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  roomId: z.string().trim().min(1),
  displayName: z.string().trim().min(1, "Display name required").max(120),
  recruiterId: z.string().trim().min(1).nullable(),
});

type Result = { ok: true } | { ok: false; error: string };

/**
 * Update a room's display name + assigned recruiter in one shot.
 * Handles the "this recruiter was assigned somewhere else" case by
 * clearing the previous binding before setting the new one - a
 * recruiter has at most ONE room.
 *
 * Revalidates /display (TV), /recruiter (recruiter's own screen),
 * /admin/queue, /admin/rooms, /admin/users so every surface picks up
 * the change without manual refresh.
 */
export async function updateRoomAction(raw: unknown): Promise<Result> {
  const me = await requireRole("SUPER_ADMIN");
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { roomId, displayName, recruiterId } = parsed.data;

  try {
    // If a recruiter is being assigned, verify they exist + are RECRUITER role.
    if (recruiterId) {
      const u = await prisma.user.findUnique({ where: { id: recruiterId } });
      if (!u) return { ok: false, error: "Selected recruiter not found" };
      if (u.role !== "RECRUITER")
        return { ok: false, error: "Selected user is not a recruiter" };
      if (!u.active)
        return { ok: false, error: "Selected user is deactivated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (txRaw: any) => {
      const tx = txRaw as typeof prisma;
      if (recruiterId) {
        // Clear any OTHER room currently pointing at this recruiter so the
        // 1-to-1 invariant holds.
        await tx.room.updateMany({
          where: { recruiterId, NOT: { id: roomId } },
          data: { recruiterId: null },
        });
      }
      await tx.room.update({
        where: { id: roomId },
        data: {
          displayName,
          recruiterId: recruiterId,
        },
      });
    });

    await prisma.auditLog
      .create({
        data: {
          actorId: me.userId,
          action: "room.update",
          target: roomId,
          payload: { displayName, recruiterId },
        },
      })
      .catch(() => undefined);

    revalidatePath("/display");
    revalidatePath("/recruiter");
    revalidatePath("/admin/queue");
    revalidatePath("/admin/rooms");
    revalidatePath("/admin/users");
    revalidatePath("/admin/live");

    return { ok: true };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[updateRoomAction] failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Update failed",
    };
  }
}

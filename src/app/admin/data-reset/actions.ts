"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

type PurgeResult =
  | {
      ok: true;
      studentsDeleted: number;
      tokensDeleted: number;
      interviewsDeleted: number;
      emailsDeleted: number;
    }
  | { ok: false; error: string };

/**
 * Wipe all student-side data so the drive starts clean. Keeps User /
 * Room / AuditLog rows intact. Resets the Token.tokenNumber serial
 * sequence so the next registration becomes #1.
 *
 * SUPER_ADMIN only. Logs the action to AuditLog with row counts for
 * permanent record.
 */
export async function purgeDriveDataAction(): Promise<PurgeResult> {
  const me = await requireRole("SUPER_ADMIN");

  try {
    // Order matters: tokens + interviews + emails reference students via
    // FK, so delete children first. We use deleteMany with no filter to
    // hit every row.
    const tokens = await prisma.token.deleteMany({});
    const interviews = await prisma.interviewLog.deleteMany({});
    const emails = await prisma.emailLog.deleteMany({});
    // Now safe to drop students. We also need to clear room.currentTokenId
    // first since it may reference a token that just got removed (FK is
    // SET NULL on Token delete but defensively nuke it anyway).
    await prisma.room.updateMany({
      where: { currentTokenId: { not: null } },
      data: { currentTokenId: null },
    });
    const students = await prisma.student.deleteMany({});

    // Reset the tokenNumber SERIAL sequence so the next registration
    // gets #1. Postgres-specific - works on Supabase. We use restart=1
    // so the next nextval() returns 1.
    await prisma.$executeRawUnsafe(
      `ALTER SEQUENCE "Token_tokenNumber_seq" RESTART WITH 1`
    );

    await prisma.auditLog
      .create({
        data: {
          actorId: me.userId,
          action: "drive.purge",
          target: "all",
          payload: {
            studentsDeleted: students.count,
            tokensDeleted: tokens.count,
            interviewsDeleted: interviews.count,
            emailsDeleted: emails.count,
          },
        },
      })
      .catch(() => undefined);

    revalidatePath("/admin");
    revalidatePath("/admin/queue");
    revalidatePath("/admin/students");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/data-reset");
    revalidatePath("/display");

    return {
      ok: true,
      studentsDeleted: students.count,
      tokensDeleted: tokens.count,
      interviewsDeleted: interviews.count,
      emailsDeleted: emails.count,
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[purgeDriveDataAction] failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Purge failed - check Vercel logs",
    };
  }
}

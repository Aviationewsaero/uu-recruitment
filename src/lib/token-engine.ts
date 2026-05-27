// Atomic token state transitions. All write to AuditLog.
// Used by recruiter dashboard (Day 4) + desk operator queue.

"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-user";
import { revalidatePath } from "next/cache";

export type EngineResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** Recruiter calls the next WAITING token into their room. Atomic via row lock. */
export async function callNextToken(
  roomId: string
): Promise<EngineResult<{ tokenNumber: number; tokenId: string }>> {
  const me = await requireRole("RECRUITER", "SUPER_ADMIN", "DESK_OPERATOR");

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (txRaw: any) => {
      const tx = txRaw as typeof prisma;

      // Lock the next waiting token (FOR UPDATE SKIP LOCKED to avoid contention)
      const rows = await tx.$queryRaw<
        { id: string; tokenNumber: number }[]
      >`SELECT id, "tokenNumber" FROM "Token"
        WHERE status = 'WAITING'
        ORDER BY "tokenNumber" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED`;
      if (rows.length === 0) {
        throw new Error("Queue empty — no waiting tokens");
      }
      const next = rows[0];

      await tx.token.update({
        where: { id: next.id },
        data: { status: "CALLED", roomId, calledAt: new Date() },
      });
      await tx.room.update({
        where: { id: roomId },
        data: { currentTokenId: next.id },
      });
      return { tokenNumber: next.tokenNumber, tokenId: next.id };
    });

    await prisma.auditLog.create({
      data: {
        actorId: me.userId,
        action: "token.call_next",
        target: result.tokenId,
        payload: { roomId, tokenNumber: result.tokenNumber },
      },
    });

    revalidatePath("/recruiter");
    revalidatePath("/display");
    revalidatePath("/admin/queue");
    return { ok: true, data: result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

/** Recruiter starts the interview — sets startedAt. */
export async function markInProgress(
  tokenId: string
): Promise<EngineResult> {
  const me = await requireRole("RECRUITER", "SUPER_ADMIN");
  await prisma.token.update({
    where: { id: tokenId },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: { actorId: me.userId, action: "token.in_progress", target: tokenId },
  });
  revalidatePath("/recruiter");
  revalidatePath("/display");
  return { ok: true };
}

/** Recruiter finishes the interview — sets DONE + completedAt. */
export async function completeToken(
  tokenId: string,
  roomId: string
): Promise<EngineResult> {
  const me = await requireRole("RECRUITER", "SUPER_ADMIN");
  await prisma.token.update({
    where: { id: tokenId },
    data: { status: "DONE", completedAt: new Date() },
  });
  await prisma.room.update({
    where: { id: roomId },
    data: { currentTokenId: null },
  });
  await prisma.auditLog.create({
    data: { actorId: me.userId, action: "token.complete", target: tokenId },
  });
  revalidatePath("/recruiter");
  revalidatePath("/display");
  return { ok: true };
}

/** Token holder didn't show — mark SKIPPED so we can recall later. */
export async function skipToken(
  tokenId: string,
  roomId: string
): Promise<EngineResult> {
  const me = await requireRole("RECRUITER", "SUPER_ADMIN", "DESK_OPERATOR");
  await prisma.token.update({
    where: { id: tokenId },
    data: { status: "SKIPPED" },
  });
  await prisma.room.update({
    where: { id: roomId },
    data: { currentTokenId: null },
  });
  await prisma.auditLog.create({
    data: { actorId: me.userId, action: "token.skip", target: tokenId },
  });
  revalidatePath("/recruiter");
  revalidatePath("/display");
  return { ok: true };
}

/** Permanent no-show — different from skipped (which can be recalled). */
export async function noShowToken(tokenId: string): Promise<EngineResult> {
  const me = await requireRole("SUPER_ADMIN", "DESK_OPERATOR");
  await prisma.token.update({
    where: { id: tokenId },
    data: { status: "NO_SHOW" },
  });
  await prisma.auditLog.create({
    data: { actorId: me.userId, action: "token.no_show", target: tokenId },
  });
  revalidatePath("/admin/queue");
  return { ok: true };
}

/** Move a SKIPPED token back to the head of WAITING (re-issue). */
export async function recallToken(tokenId: string): Promise<EngineResult> {
  const me = await requireRole("SUPER_ADMIN", "DESK_OPERATOR");
  await prisma.token.update({
    where: { id: tokenId },
    data: { status: "WAITING", calledAt: null, startedAt: null },
  });
  await prisma.auditLog.create({
    data: { actorId: me.userId, action: "token.recall", target: tokenId },
  });
  revalidatePath("/recruiter");
  revalidatePath("/display");
  revalidatePath("/admin/queue");
  return { ok: true };
}

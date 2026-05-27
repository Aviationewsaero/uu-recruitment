"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-user";
import { callNextToken } from "@/lib/token-engine";

const decisionSchema = z.object({
  tokenId: z.string().uuid(),
  studentId: z.string().uuid(),
  roomId: z.string().uuid(),
  decision: z.enum([
    "SHORTLISTED",
    "REJECTED",
    "HOLD",
    "RE_INTERVIEW",
    "SELECTED",
  ]),
  rating: z.coerce.number().int().min(1).max(5),
  notes: z.string().trim().max(2000).optional(),
  autoAdvance: z.boolean(),
});

export type DecisionResult =
  | { ok: true; nextTokenNumber?: number }
  | { ok: false; error: string };

export async function submitInterviewDecision(
  raw: unknown
): Promise<DecisionResult> {
  const me = await requireRole("RECRUITER", "SUPER_ADMIN");
  const parsed = decisionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const { tokenId, studentId, roomId, decision, rating, notes, autoAdvance } =
    parsed.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (txRaw: any) => {
      const tx = txRaw as typeof prisma;
      const token = await tx.token.findUnique({ where: { id: tokenId } });
      if (!token) throw new Error("Token not found");
      if (token.status !== "IN_PROGRESS" && token.status !== "CALLED") {
        throw new Error(
          `Cannot record decision: token is ${token.status.toLowerCase()}`
        );
      }
      const startedAt = token.startedAt ?? token.calledAt ?? new Date();
      const endedAt = new Date();

      await tx.interviewLog.create({
        data: {
          studentId,
          recruiterId: me.userId,
          roomId,
          rating,
          notes: notes ?? null,
          decision,
          startedAt,
          endedAt,
        },
      });
      await tx.student.update({
        where: { id: studentId },
        data: { status: decision },
      });
      await tx.token.update({
        where: { id: tokenId },
        data: { status: "DONE", completedAt: endedAt },
      });
      await tx.room.update({
        where: { id: roomId },
        data: { currentTokenId: null },
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: me.userId,
        action: "interview.decision",
        target: studentId,
        payload: { tokenId, decision, rating },
      },
    });

    revalidatePath("/recruiter");
    revalidatePath("/display");
    revalidatePath("/admin");
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Submit failed",
    };
  }

  // Optionally call the next token immediately
  if (autoAdvance) {
    const r = await callNextToken(roomId);
    if (r.ok) return { ok: true, nextTokenNumber: r.data?.tokenNumber };
  }
  return { ok: true };
}

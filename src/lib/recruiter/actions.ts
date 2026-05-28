"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-user";
import { callNextToken } from "@/lib/token-engine";
import { sendEmail } from "@/lib/email";
import { templateForDecision } from "@/lib/email/templates";

// NOTE (security C4): studentId is intentionally NOT accepted from the
// client. We derive it server-side from the token row to prevent a
// recruiter from flipping the status of an arbitrary student by passing
// a foreign studentId with a valid tokenId/roomId of their own.
const decisionSchema = z.object({
  tokenId: z.string().uuid(),
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
  const { tokenId, roomId, decision, rating, notes, autoAdvance } =
    parsed.data;

  let studentId = "";

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (txRaw: any) => {
      const tx = txRaw as typeof prisma;

      // C3: verify the room actually belongs to this recruiter (or caller is
      // SUPER_ADMIN). Without this any logged-in recruiter could mutate any
      // other room's current token.
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) throw new Error("Room not found");
      if (
        me.role !== "SUPER_ADMIN" &&
        room.recruiterId !== me.userId
      ) {
        throw new Error("This room is not assigned to you");
      }

      const token = await tx.token.findUnique({ where: { id: tokenId } });
      if (!token) throw new Error("Token not found");
      if (token.status !== "IN_PROGRESS" && token.status !== "CALLED") {
        throw new Error(
          `Cannot record decision: token is ${token.status.toLowerCase()}`
        );
      }
      // Token must be the one currently called into THIS room.
      if (token.roomId !== roomId) {
        throw new Error("Token is not in this room");
      }
      // C4: derive studentId from the token, not from the client payload.
      studentId = token.studentId as string;

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
    revalidatePath("/admin/queue");
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Submit failed",
    };
  }

  // Fire decision-result email (non-blocking — if it fails we don't roll back the decision)
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { token: true },
  });
  if (student && student.token) {
    const tmpl = templateForDecision(decision, {
      fullName: student.fullName,
      tokenNumber: student.token.tokenNumber,
      registrationId: student.registrationId,
    });
    await sendEmail(
      { to: student.email, subject: tmpl.subject, html: tmpl.html },
      { studentId, template: `decision_${decision.toLowerCase()}` }
    ).catch(() => undefined);
  }

  // Optionally call the next token immediately
  if (autoAdvance) {
    const r = await callNextToken(roomId);
    if (r.ok) return { ok: true, nextTokenNumber: r.data?.tokenNumber };
  }
  return { ok: true };
}

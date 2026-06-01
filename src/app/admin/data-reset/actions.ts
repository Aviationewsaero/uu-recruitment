"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

// ─── Token-range delete ───────────────────────────────────────────────────
// Used to scrub leftover test registrations before publishing reports.
// Operator types the inclusive [minToken, maxToken] range; we look up
// matching tokens, cascade-delete the student + interview logs + email
// log rows tied to them. Token sequence is left untouched (no resequencing).

const rangeSchema = z.object({
  minToken: z.coerce.number().int().min(1),
  maxToken: z.coerce.number().int().min(1),
});

type RangeResult =
  | { ok: true; studentsDeleted: number; tokensDeleted: number; interviewsDeleted: number; emailsDeleted: number }
  | { ok: false; error: string };

/** Preview-only: count how many students would be deleted in [min, max]. */
export async function previewTokenRangeAction(raw: unknown): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  await requireRole("SUPER_ADMIN");
  const parsed = rangeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid range" };
  if (parsed.data.minToken > parsed.data.maxToken)
    return { ok: false, error: "Min token must be <= max token" };

  const count = await prisma.token.count({
    where: {
      tokenNumber: {
        gte: parsed.data.minToken,
        lte: parsed.data.maxToken,
      },
    },
  });
  return { ok: true, count };
}

export async function deleteTokenRangeAction(raw: unknown): Promise<RangeResult> {
  const me = await requireRole("SUPER_ADMIN");
  const parsed = rangeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid range" };
  if (parsed.data.minToken > parsed.data.maxToken)
    return { ok: false, error: "Min token must be <= max token" };

  const { minToken, maxToken } = parsed.data;

  try {
    // Find matching tokens to extract their studentIds.
    const tokens = await prisma.token.findMany({
      where: { tokenNumber: { gte: minToken, lte: maxToken } },
      select: { id: true, studentId: true },
    });
    const tokenIds = tokens.map((t) => t.id as string);
    const studentIds = tokens.map((t) => t.studentId as string);

    if (tokenIds.length === 0) {
      return {
        ok: true,
        studentsDeleted: 0,
        tokensDeleted: 0,
        interviewsDeleted: 0,
        emailsDeleted: 0,
      };
    }

    // Clear room pointers first so token delete doesn't FK-fail.
    await prisma.room.updateMany({
      where: { currentTokenId: { in: tokenIds } },
      data: { currentTokenId: null },
    });

    const tokensDel = await prisma.token.deleteMany({
      where: { id: { in: tokenIds } },
    });
    const interviewsDel = await prisma.interviewLog.deleteMany({
      where: { studentId: { in: studentIds } },
    });
    const emailsDel = await prisma.emailLog.deleteMany({
      where: { studentId: { in: studentIds } },
    });
    const studentsDel = await prisma.student.deleteMany({
      where: { id: { in: studentIds } },
    });

    await prisma.auditLog
      .create({
        data: {
          actorId: me.userId,
          action: "drive.purge_range",
          target: `tokens ${minToken}-${maxToken}`,
          payload: {
            minToken,
            maxToken,
            studentsDeleted: studentsDel.count,
            tokensDeleted: tokensDel.count,
            interviewsDeleted: interviewsDel.count,
            emailsDeleted: emailsDel.count,
          },
        },
      })
      .catch(() => undefined);

    revalidatePath("/admin");
    revalidatePath("/admin/queue");
    revalidatePath("/admin/students");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/data-reset");
    revalidatePath("/admin/status-report");
    revalidatePath("/admin/live");
    revalidatePath("/display");

    return {
      ok: true,
      studentsDeleted: studentsDel.count,
      tokensDeleted: tokensDel.count,
      interviewsDeleted: interviewsDel.count,
      emailsDeleted: emailsDel.count,
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[deleteTokenRangeAction] failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Range delete failed",
    };
  }
}
// ─── End token-range delete ───────────────────────────────────────────────


// Each flag toggles one category of purge. Defaults to false so the
// caller must opt-in explicitly per box. The action returns per-category
// counts so the UI can show what actually happened.

const inputSchema = z.object({
  students: z.boolean(),
  emails: z.boolean(),
  audits: z.boolean(),
  resetSequence: z.boolean(),
});

type Input = z.infer<typeof inputSchema>;

type PurgeResult =
  | {
      ok: true;
      studentsDeleted: number;
      tokensDeleted: number;
      interviewsDeleted: number;
      emailsDeleted: number;
      auditsDeleted: number;
      sequenceReset: boolean;
    }
  | { ok: false; error: string };

/**
 * Selective wipe of student-side data. Each category is independent.
 * SUPER_ADMIN only. Logs the operation to AuditLog (NEW row, so survives
 * even if the user purged audit history) with per-category counts.
 */
export async function purgeDriveDataAction(raw: unknown): Promise<PurgeResult> {
  const me = await requireRole("SUPER_ADMIN");

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }
  const opts: Input = parsed.data;

  if (!opts.students && !opts.emails && !opts.audits && !opts.resetSequence) {
    return { ok: false, error: "Select at least one category to purge." };
  }

  let studentsDeleted = 0;
  let tokensDeleted = 0;
  let interviewsDeleted = 0;
  let emailsDeleted = 0;
  let auditsDeleted = 0;
  let sequenceReset = false;

  try {
    if (opts.students) {
      // Order matters: drop child rows referencing Student before parents.
      const tokens = await prisma.token.deleteMany({});
      const interviews = await prisma.interviewLog.deleteMany({});
      // Clear any room pointers to tokens that just got nuked.
      await prisma.room.updateMany({
        where: { currentTokenId: { not: null } },
        data: { currentTokenId: null },
      });
      const students = await prisma.student.deleteMany({});
      tokensDeleted = tokens.count;
      interviewsDeleted = interviews.count;
      studentsDeleted = students.count;
    }

    if (opts.emails) {
      const r = await prisma.emailLog.deleteMany({});
      emailsDeleted = r.count;
    }

    if (opts.audits) {
      // Important: this wipes the security trail. We still log the purge
      // AFTER, so there's at least a "drive.purge" record left as evidence.
      const r = await prisma.auditLog.deleteMany({});
      auditsDeleted = r.count;
    }

    if (opts.resetSequence) {
      // Postgres-specific - works on Supabase. nextval() will return 1
      // after this so the next registration becomes token #1.
      await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE "Token_tokenNumber_seq" RESTART WITH 1`
      );
      sequenceReset = true;
    }

    // Always log the purge as the LAST step so it survives even when
    // audits=true was used (the wipe happens, then this fresh row lands).
    await prisma.auditLog
      .create({
        data: {
          actorId: me.userId,
          action: "drive.purge",
          target: "selective",
          payload: {
            ...opts,
            studentsDeleted,
            tokensDeleted,
            interviewsDeleted,
            emailsDeleted,
            auditsDeleted,
            sequenceReset,
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
      studentsDeleted,
      tokensDeleted,
      interviewsDeleted,
      emailsDeleted,
      auditsDeleted,
      sequenceReset,
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

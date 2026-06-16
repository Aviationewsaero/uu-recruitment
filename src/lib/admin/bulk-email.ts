"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-user";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

const audienceSchema = z.object({
  status: z.string().optional(),
  course: z.string().optional(),
  semester: z.string().optional(),
});

const bulkSchema = z.object({
  audience: audienceSchema,
  subject: z.string().trim().min(3, "Subject required").max(200),
  htmlBody: z.string().trim().min(10, "Body too short").max(50000),
});

export type PreviewResult = { count: number; sample: string[] };

export async function previewAudienceAction(
  raw: unknown
): Promise<PreviewResult> {
  await requireRole("SUPER_ADMIN", "EMAIL_MANAGER");
  const a = audienceSchema.parse(raw);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (a.status) where.status = a.status;
  if (a.course) where.course = a.course;
  if (a.semester) where.semester = a.semester;
  const [count, sample] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      select: { email: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { count, sample: sample.map((s) => s.email) };
}

export type BulkSendResult =
  | { ok: true; sent: number; failed: number }
  | { ok: false; error: string };

const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1100; // Resend free tier: ~2/sec safe

const SHELL = (subject: string, htmlBody: string) => `<!doctype html>
<html><body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;background:#f8fafc;">
<div style="max-width:560px;margin:0 auto;background:#fff;">
  <div style="background:linear-gradient(135deg,#1e3a8a,#172a5e);color:#fff;padding:24px 28px;">
    <p style="margin:0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.7);">Elite World Services Limited</p>
    <h1 style="margin:4px 0 0 0;font-size:20px;">${subject}</h1>
  </div>
  <div style="height:4px;background:#22c55e;"></div>
  <div style="padding:28px;line-height:1.6;font-size:15px;">${htmlBody}</div>
  <div style="padding:20px 28px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b;">
    © 2026 Elite World Services Limited · UU Aviation Recruitment 2026
  </div>
</div>
</body></html>`;

export async function sendBulkAction(raw: unknown): Promise<BulkSendResult> {
  const me = await requireRole("SUPER_ADMIN", "EMAIL_MANAGER");
  const parsed = bulkSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const { audience, subject, htmlBody } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (audience.status) where.status = audience.status;
  if (audience.course) where.course = audience.course;
  if (audience.semester) where.semester = audience.semester;

  const targets = await prisma.student.findMany({
    where,
    select: { id: true, email: true, fullName: true, registrationId: true },
  });
  if (targets.length === 0)
    return { ok: false, error: "No students match this audience" };

  await prisma.auditLog.create({
    data: {
      actorId: me.userId,
      action: "email.bulk_send",
      payload: { audience, subject, target_count: targets.length },
    },
  });

  const html = SHELL(subject, htmlBody);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((t) =>
        sendEmail(
          { to: t.email, subject, html },
          { studentId: t.id, template: "bulk_announcement" }
        ).catch(() => ({ ok: false as const, error: "send threw" }))
      )
    );
    for (const r of results) (r.ok ? sent++ : failed++);
    if (i + BATCH_SIZE < targets.length)
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
  }

  revalidatePath("/admin/emails");
  return { ok: true, sent, failed };
}

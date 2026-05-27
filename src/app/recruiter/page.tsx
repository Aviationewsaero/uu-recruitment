import Link from "next/link";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/storage";
import { RecruiterDashboard } from "./RecruiterDashboard";

export const dynamic = "force-dynamic";

export default async function RecruiterPage() {
  const me = await requireRole("RECRUITER", "SUPER_ADMIN");

  // Find this recruiter's assigned room. Super admins may not have one — render a chooser.
  const myRoom = await prisma.room.findFirst({
    where: { recruiterId: me.userId, active: true },
  });

  if (!myRoom) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-text">
          No room assigned to you yet
        </h1>
        <p className="mt-3 text-brand-muted">
          Ask the super admin to assign you a room before the drive starts.
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block rounded-md border border-brand-border bg-white px-4 py-2 text-sm font-medium hover:bg-brand-bg"
        >
          Sign in as a different user
        </Link>
      </div>
    );
  }

  const [currentToken, waitingCount, todayDone] = await Promise.all([
    myRoom.currentTokenId
      ? prisma.token.findUnique({
          where: { id: myRoom.currentTokenId },
          include: { student: true },
        })
      : null,
    prisma.token.count({ where: { status: "WAITING" } }),
    prisma.token.count({
      where: {
        roomId: myRoom.id,
        status: "DONE",
        completedAt: { gte: startOfToday() },
      },
    }),
  ]);

  const studentDocUrls = currentToken?.student
    ? {
        photo: currentToken.student.passportPhoto
          ? await getFileUrl("student-documents", currentToken.student.passportPhoto)
          : null,
        resume: currentToken.student.resumeUrl
          ? await getFileUrl("student-documents", currentToken.student.resumeUrl)
          : null,
      }
    : null;

  return (
    <RecruiterDashboard
      room={{ id: myRoom.id, displayName: myRoom.displayName }}
      currentToken={
        currentToken && currentToken.student
          ? {
              id: currentToken.id,
              tokenNumber: currentToken.tokenNumber,
              status: currentToken.status,
              calledAt: currentToken.calledAt?.toISOString() ?? null,
              startedAt: currentToken.startedAt?.toISOString() ?? null,
              student: {
                id: currentToken.student.id,
                registrationId: currentToken.student.registrationId,
                fullName: currentToken.student.fullName,
                fatherName: currentToken.student.fatherName,
                motherName: currentToken.student.motherName,
                email: currentToken.student.email,
                phone: currentToken.student.phone,
                gender: currentToken.student.gender,
                address: currentToken.student.address,
                course: currentToken.student.course,
                semester: currentToken.student.semester,
                specialization: currentToken.student.specialization,
                tenthPercent: currentToken.student.tenthPercent.toString(),
                twelfthPercent: currentToken.student.twelfthPercent.toString(),
                tenthState: currentToken.student.tenthState,
                twelfthState: currentToken.student.twelfthState,
                graduationCgpa:
                  currentToken.student.graduationCgpa?.toString() ?? null,
              },
              docs: studentDocUrls!,
            }
          : null
      }
      waitingCount={waitingCount}
      todayDone={todayDone}
    />
  );
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

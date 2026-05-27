import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { QueueClient } from "./QueueClient";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  await requireRole("SUPER_ADMIN", "DESK_OPERATOR");

  const tokens = await prisma.token.findMany({
    orderBy: { tokenNumber: "asc" },
    include: {
      student: {
        select: { id: true, fullName: true, course: true, semester: true },
      },
      room: { select: { displayName: true, roomNumber: true } },
    },
  });

  const items = tokens.map((t) => ({
    id: t.id,
    tokenNumber: t.tokenNumber,
    status: t.status,
    roomId: t.roomId,
    roomLabel: t.room?.displayName ?? null,
    studentName: t.student?.fullName ?? "—",
    course: t.student?.course ?? "",
    semester: t.student?.semester ?? "",
    calledAt: t.calledAt?.toISOString() ?? null,
  }));

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Live queue</h1>
        <p className="mt-1 text-sm text-brand-muted">
          {tokens.length} total token{tokens.length === 1 ? "" : "s"} issued
          today.
        </p>
      </header>
      <QueueClient initial={items} />
    </div>
  );
}

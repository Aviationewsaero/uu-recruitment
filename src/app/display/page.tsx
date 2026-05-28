import { prisma } from "@/lib/prisma";
import { DisplayBoard } from "./DisplayBoard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DisplayPage() {
  // Three independent queries — fire in parallel.
  const [rooms, upcoming, waitingCount] = await Promise.all([
    prisma.room.findMany({
      where: { active: true },
      orderBy: { roomNumber: "asc" },
      select: {
        id: true,
        roomNumber: true,
        displayName: true,
        currentTokenId: true,
      },
    }),
    prisma.token.findMany({
      where: { status: "WAITING" },
      orderBy: { tokenNumber: "asc" },
      take: 8,
      select: { tokenNumber: true },
    }),
    prisma.token.count({ where: { status: "WAITING" } }),
  ]);

  // Perf #5 fix: was N+1 (one findUnique per room). Collect all current
  // token IDs and fetch them in a single IN() query.
  const currentIds = rooms
    .map((r) => r.currentTokenId)
    .filter((id): id is string => !!id);
  const currentTokens = currentIds.length
    ? await prisma.token.findMany({
        where: { id: { in: currentIds } },
        select: {
          id: true,
          tokenNumber: true,
          status: true,
          student: { select: { fullName: true } },
        },
      })
    : [];
  const byId = new Map(currentTokens.map((t) => [t.id, t]));

  const roomsWithCurrent = rooms.map((r) => {
    const t = r.currentTokenId ? byId.get(r.currentTokenId) : null;
    return {
      id: r.id,
      roomNumber: r.roomNumber,
      displayName: r.displayName,
      currentToken: t
        ? {
            tokenNumber: t.tokenNumber,
            studentName: t.student?.fullName ?? "",
            status: t.status,
          }
        : null,
    };
  });

  return (
    <DisplayBoard
      rooms={roomsWithCurrent}
      upcoming={upcoming.map((u) => u.tokenNumber)}
      waitingCount={waitingCount}
    />
  );
}

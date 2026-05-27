import { prisma } from "@/lib/prisma";
import { DisplayBoard } from "./DisplayBoard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DisplayPage() {
  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: { roomNumber: "asc" },
    include: {
      tokens: {
        where: { id: { equals: undefined } }, // placeholder so type works
      },
    },
  });

  // Hydrate current token per room
  const roomsWithCurrent = await Promise.all(
    rooms.map(async (r) => {
      const current = r.currentTokenId
        ? await prisma.token.findUnique({
            where: { id: r.currentTokenId },
            include: { student: { select: { fullName: true } } },
          })
        : null;
      return {
        id: r.id,
        roomNumber: r.roomNumber,
        displayName: r.displayName,
        currentToken: current
          ? {
              tokenNumber: current.tokenNumber,
              studentName: current.student?.fullName ?? "",
              status: current.status,
            }
          : null,
      };
    })
  );

  const upcoming = await prisma.token.findMany({
    where: { status: "WAITING" },
    orderBy: { tokenNumber: "asc" },
    take: 8,
    select: { tokenNumber: true },
  });

  const waitingCount = await prisma.token.count({
    where: { status: "WAITING" },
  });

  return (
    <DisplayBoard
      rooms={roomsWithCurrent}
      upcoming={upcoming.map((u) => u.tokenNumber)}
      waitingCount={waitingCount}
    />
  );
}

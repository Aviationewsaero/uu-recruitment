// Quick room editor for super admin. Lets you change a room's display
// name + assigned recruiter mid-drive. /display and /recruiter
// revalidate automatically so the TV picks up the change within ~5s.

import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { RoomsList } from "./RoomsList";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  await requireRole("SUPER_ADMIN");

  const [rooms, recruiters] = await Promise.all([
    prisma.room.findMany({
      orderBy: { roomNumber: "asc" },
      include: {
        recruiter: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "RECRUITER", active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, email: true },
    }),
  ]);

  const data = rooms.map((r) => ({
    id: r.id as string,
    roomNumber: r.roomNumber,
    displayName: r.displayName,
    active: r.active,
    recruiterId: (r.recruiterId as string | null) ?? null,
    recruiterLabel: r.recruiter
      ? `${r.recruiter.fullName} (${r.recruiter.email})`
      : null,
  }));

  const recOptions = recruiters.map((u) => ({
    id: u.id as string,
    label: `${u.fullName} (${u.email})`,
  }));

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Rooms</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Edit display names + reassign recruiters. Changes appear on the
          live TV board and the recruiter dashboard within a few seconds.
        </p>
      </header>

      <RoomsList rooms={data} recruiters={recOptions} />

      <p className="text-xs text-brand-muted">
        Each row has its own Save button so changes are applied
        per-room. If the recruiter you want isn&apos;t in the dropdown,
        first create them on{" "}
        <code className="rounded bg-brand-bg px-1 py-0.5">/admin/users</code>{" "}
        as role RECRUITER.
      </p>
    </div>
  );
}

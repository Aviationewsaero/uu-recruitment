"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { updateRoomAction } from "./actions";

type Room = {
  id: string;
  roomNumber: string;
  displayName: string;
  active: boolean;
  recruiterId: string | null;
  recruiterLabel: string | null;
};

type Recruiter = {
  id: string;
  label: string;
};

export function RoomsList({
  rooms,
  recruiters,
}: {
  rooms: Room[];
  recruiters: Recruiter[];
}) {
  return (
    <div className="space-y-4">
      {rooms.map((r) => (
        <RoomRow key={r.id} initial={r} recruiters={recruiters} />
      ))}
    </div>
  );
}

function RoomRow({
  initial,
  recruiters,
}: {
  initial: Room;
  recruiters: Recruiter[];
}) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [recruiterId, setRecruiterId] = useState(initial.recruiterId ?? "");
  const [pending, start] = useTransition();
  const router = useRouter();

  const dirty =
    displayName.trim() !== initial.displayName.trim() ||
    (recruiterId || null) !== initial.recruiterId;

  function save() {
    start(async () => {
      const r = await updateRoomAction({
        roomId: initial.id,
        displayName: displayName.trim(),
        recruiterId: recruiterId || null,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`${initial.roomNumber} updated`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            Room number
          </p>
          <p className="text-3xl font-extrabold text-brand-navy">
            {initial.roomNumber}
          </p>
        </div>
        {!initial.active && (
          <span className="text-xs font-semibold text-amber-700">inactive</span>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-brand-muted mb-1">
            Display name (shown on TV + recruiter screen)
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Aviation Conclave"
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-brand-muted mb-1">
            Assigned recruiter
          </label>
          <Select
            value={recruiterId}
            onChange={(e) => setRecruiterId(e.target.value)}
          >
            <option value="">— no recruiter —</option>
            {recruiters.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </Select>
          {initial.recruiterLabel && !recruiterId && (
            <p className="mt-1 text-xs text-amber-700">
              Currently: {initial.recruiterLabel} — saving will clear.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          onClick={save}
          disabled={!dirty || pending || displayName.trim().length === 0}
        >
          {pending ? "Saving…" : dirty ? "Save changes" : "No changes"}
        </Button>
      </div>
    </div>
  );
}

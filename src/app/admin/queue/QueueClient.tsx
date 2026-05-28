"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { skipToken, recallToken, noShowToken } from "@/lib/token-engine";

type Item = {
  id: string;
  tokenNumber: number;
  status: string;
  roomId: string | null;
  roomLabel: string | null;
  studentName: string;
  course: string;
  semester: string;
  calledAt: string | null;
};

const STATUSES = [
  { value: "ALL", label: "All" },
  { value: "WAITING", label: "Waiting" },
  { value: "CALLED", label: "Called" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "SKIPPED", label: "Skipped" },
  { value: "DONE", label: "Done" },
  { value: "NO_SHOW", label: "No-show" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  WAITING: "bg-amber-100 text-amber-800",
  CALLED: "bg-brand-blue/15 text-brand-blue",
  IN_PROGRESS: "bg-brand-blue/15 text-brand-blue",
  DONE: "bg-brand-green/15 text-brand-green-dark",
  SKIPPED: "bg-orange-100 text-orange-700",
  NO_SHOW: "bg-red-100 text-red-700",
};

export function QueueClient({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [pending, start] = useTransition();

  // Auto-refresh every 5s
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  const visible = useMemo(
    () => (filter === "ALL" ? initial : initial.filter((t) => t.status === filter)),
    [initial, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of initial) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [initial]);

  const act = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    item: Item,
    label: string
  ) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Action failed");
      else {
        toast.success(`Token #${item.tokenNumber} ${label}`);
        router.refresh();
      }
    });

  return (
    <div>
      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const n = s.value === "ALL" ? initial.length : counts[s.value] ?? 0;
          const active = filter === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-brand-navy text-white"
                  : "border border-brand-border bg-white text-brand-text hover:bg-brand-bg"
              }`}
            >
              {s.label}{" "}
              <span className={active ? "text-white/70" : "text-brand-muted"}>
                ({n})
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
        <table className="w-full text-sm">
          <thead className="bg-brand-bg text-left text-xs uppercase tracking-widest text-brand-muted">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-brand-muted">
                  No tokens in this state.
                </td>
              </tr>
            ) : (
              visible.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-brand-border hover:bg-brand-bg/50"
                >
                  <td className="px-4 py-3 text-2xl font-extrabold tabular-nums text-brand-navy leading-none">
                    #{t.tokenNumber}
                  </td>
                  <td className="px-4 py-3">{t.studentName}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {t.course} {t.semester && `· ${t.semester}`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[t.status] ?? "bg-brand-bg text-brand-muted"
                      }`}
                    >
                      {t.status.replace("_", " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {t.roomLabel ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {(t.status === "WAITING" || t.status === "CALLED") &&
                        t.roomId && (
                          <button
                            disabled={pending}
                            onClick={() =>
                              act(() => skipToken(t.id, t.roomId!), t, "skipped")
                            }
                            className="rounded border border-brand-border bg-white px-2 py-1 text-xs hover:bg-brand-bg"
                          >
                            Skip
                          </button>
                        )}
                      {t.status === "SKIPPED" && (
                        <>
                          <button
                            disabled={pending}
                            onClick={() =>
                              act(() => recallToken(t.id), t, "recalled to queue")
                            }
                            className="rounded bg-brand-green px-2 py-1 text-xs font-medium text-white hover:bg-brand-green-dark"
                          >
                            Recall
                          </button>
                          <button
                            disabled={pending}
                            onClick={() =>
                              act(() => noShowToken(t.id), t, "marked no-show")
                            }
                            className="rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          >
                            No-show
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

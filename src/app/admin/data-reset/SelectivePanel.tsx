"use client";

// Per-student selective delete. Operator ticks the rows to remove,
// types DELETE, gone. Includes search + select all + indeterminate
// header checkbox for the standard table UX.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deleteStudentsByIdsAction } from "./actions";

const CONFIRM_PHRASE = "DELETE";

export type SelectableStudent = {
  id: string;
  tokenNumber: number | null;
  registrationId: string;
  fullName: string;
  phone: string;
  status: string;
  course: string;
};

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-brand-bg text-brand-muted",
  SHORTLISTED: "bg-brand-green/15 text-brand-green-dark",
  SELECTED: "bg-brand-green/30 text-brand-green-dark",
  HOLD: "bg-amber-100 text-amber-800",
  RE_INTERVIEW: "bg-brand-blue/15 text-brand-blue",
  REJECTED: "bg-red-100 text-red-700",
};

export function SelectivePanel({ students }: { students: SelectableStudent[] }) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.registrationId.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.tokenNumber !== null && `#${s.tokenNumber}`.includes(q)) ||
        s.status.toLowerCase().includes(q)
    );
  }, [students, search]);

  // Header checkbox state: checked / unchecked / indeterminate based on
  // how many of the currently-visible rows are selected.
  const visibleIds = filtered.map((s) => s.id);
  const visibleSelectedCount = visibleIds.filter((id) => selectedIds.has(id))
    .length;
  const allVisibleSelected =
    visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  const someVisibleSelected =
    visibleSelectedCount > 0 && !allVisibleSelected;

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const canSubmit =
    selectedIds.size > 0 && typed.trim() === CONFIRM_PHRASE && !pending;

  function doDelete() {
    start(async () => {
      const r = await deleteStudentsByIdsAction({
        studentIds: Array.from(selectedIds),
      });
      if (!r.ok) {
        setDone({ ok: false, message: r.error });
        toast.error(r.error);
        return;
      }
      setDone({
        ok: true,
        message: `Deleted ${r.studentsDeleted} students, ${r.tokensDeleted} tokens, ${r.interviewsDeleted} interview logs, ${r.emailsDeleted} email logs.`,
      });
      toast.success(`Deleted ${r.studentsDeleted} students`);
      setSelectedIds(new Set());
      setTyped("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Search + selection summary */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by token #, name, reg ID, phone, status…"
          className="flex-1 min-w-[240px]"
        />
        <div className="text-sm text-brand-text">
          <strong className="text-red-700">{selectedIds.size}</strong> selected ·{" "}
          <span className="text-brand-muted">
            {filtered.length} of {students.length} shown
          </span>
        </div>
        {selectedIds.size > 0 && (
          <Button type="button" variant="outline" onClick={clearSelection}>
            Clear selection
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-red-200 overflow-hidden max-h-[480px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-red-100 text-xs font-semibold uppercase tracking-wider text-red-900 sticky top-0">
            <tr>
              <th className="w-10 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someVisibleSelected;
                  }}
                  onChange={toggleVisible}
                  className="h-4 w-4 rounded border-red-300 text-red-700 focus:ring-red-500 cursor-pointer"
                />
              </th>
              <th className="px-3 py-2 text-left">Token</th>
              <th className="px-3 py-2 text-left">Reg ID</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Course</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-sm text-brand-muted"
                >
                  No students match this search.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const checked = selectedIds.has(s.id);
                return (
                  <tr
                    key={s.id}
                    onClick={() => toggleOne(s.id)}
                    className={`cursor-pointer ${checked ? "bg-red-50" : "hover:bg-red-50/40"}`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-red-300 text-red-700 focus:ring-red-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2 font-bold text-brand-navy tabular-nums">
                      {s.tokenNumber !== null ? `#${s.tokenNumber}` : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-brand-muted">
                      {s.registrationId}
                    </td>
                    <td className="px-3 py-2 font-medium text-brand-text">
                      {s.fullName}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {s.phone}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          STATUS_TONE[s.status] ?? "bg-brand-bg text-brand-muted"
                        }`}
                      >
                        {s.status.replace("_", " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-brand-muted">
                      {s.course}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation */}
      {selectedIds.size > 0 && (
        <div className="border-t border-red-200 pt-4">
          <label className="block text-sm font-medium text-red-900">
            Type{" "}
            <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs font-bold text-red-700">
              {CONFIRM_PHRASE}
            </code>{" "}
            to confirm deletion of <strong>{selectedIds.size}</strong> student
            {selectedIds.size === 1 ? "" : "s"}:
          </label>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            autoComplete="off"
            className="mt-2 font-mono"
          />
          <Button
            type="button"
            variant="danger"
            className="mt-3"
            disabled={!canSubmit}
            onClick={doDelete}
          >
            {pending
              ? "Deleting…"
              : `Delete ${selectedIds.size} selected student${selectedIds.size === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}

      {done && (
        <div
          className={`rounded-md border p-3 text-sm ${
            done.ok
              ? "border-brand-green/40 bg-brand-green/5 text-brand-green-dark"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {done.ok ? "✅ " : "❌ "}
          {done.message}
        </div>
      )}
    </div>
  );
}

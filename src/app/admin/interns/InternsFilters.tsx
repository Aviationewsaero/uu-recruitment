"use client";

import Link from "next/link";

type Props = {
  currentStatus: string;
  currentDepartment: string;
  departments: string[];
  counts: Record<string, number>;
  total: number;
};

const TABS = [
  { key: "", label: "All" },
  { key: "PENDING_VERIFICATION", label: "Pending" },
  { key: "ACTIVE", label: "Active" },
  { key: "INACTIVE", label: "Inactive" },
  { key: "COMPLETED", label: "Completed" },
  { key: "TERMINATED", label: "Terminated" },
];

export function InternsFilters({
  currentStatus,
  currentDepartment,
  departments,
  counts,
  total,
}: Props) {
  const activeKey =
    currentStatus && !currentStatus.includes(",") && TABS.some((t) => t.key === currentStatus)
      ? currentStatus
      : "";

  function tabHref(key: string) {
    const p = new URLSearchParams();
    if (key) p.set("status", key);
    if (currentDepartment) p.set("department", currentDepartment);
    const qs = p.toString();
    return qs ? `/admin/interns?${qs}` : "/admin/interns";
  }

  return (
    <div className="mb-6 flex items-end justify-between border-b border-brand-border">
      {/* Status tabs */}
      <nav className="flex gap-0" aria-label="Filter by status">
        {TABS.map(({ key, label }) => {
          const count = key === "" ? total : (counts[key] ?? 0);
          const isActive = activeKey === key;
          return (
            <Link
              key={key}
              href={tabHref(key)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-brand-muted hover:border-brand-border hover:text-brand-text"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  isActive
                    ? "bg-brand-blue text-white"
                    : "bg-brand-bg text-brand-muted"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Department filter */}
      <div className="flex items-center gap-2 pb-2">
        <label className="text-xs uppercase tracking-widest text-brand-muted">Dept</label>
        <select
          value={currentDepartment}
          onChange={(e) => {
            const p = new URLSearchParams();
            if (currentStatus) p.set("status", currentStatus);
            if (e.target.value) p.set("department", e.target.value);
            const qs = p.toString();
            window.location.href = qs ? `/admin/interns?${qs}` : "/admin/interns";
          }}
          className="rounded-md border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-text"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

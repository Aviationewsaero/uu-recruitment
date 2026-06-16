"use client";

type Props = {
  status: string[];
  department: string[];
  departments: string[];
};

export function InternsFilters({ status, department, departments }: Props) {
  function applyFilter(key: "status" | "department", values: string[]) {
    const params = new URLSearchParams(window.location.search);
    params.delete("page");
    if (values.length > 0) {
      params.set(key, values.join(","));
    } else {
      params.delete(key);
    }
    window.location.search = params.toString();
  }

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <div>
        <label className="block text-xs uppercase tracking-widest text-brand-muted">
          Status
        </label>
        <select
          multiple
          defaultValue={status}
          className="mt-1 rounded-md border border-brand-border px-3 py-2 text-sm"
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (o) => o.value);
            applyFilter("status", selected);
          }}
        >
          <option value="PENDING_VERIFICATION">Pending Verification</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="COMPLETED">Completed</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-brand-muted">
          Department
        </label>
        <select
          multiple
          defaultValue={department}
          className="mt-1 rounded-md border border-brand-border px-3 py-2 text-sm"
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (o) => o.value);
            applyFilter("department", selected);
          }}
        >
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

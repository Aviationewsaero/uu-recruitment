"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input, Select } from "@/components/ui/Input";
import { STATUS_OPTIONS } from "@/lib/admin/student-filters";

type Props = {
  initial: {
    search?: string;
    status?: string;
    course?: string;
    semester?: string;
  };
  courses: string[];
  semesters: string[];
};

export function StudentsFilters({ initial, courses, semesters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  const update = (key: string, value: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete("page"); // any filter change resets pagination
    start(() => router.push(`${pathname}?${sp.toString()}`));
  };

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        placeholder="Search name, email, phone, reg ID…"
        defaultValue={initial.search ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value);
        }}
        disabled={pending}
      />
      <Select
        defaultValue={initial.status ?? ""}
        onChange={(e) => update("status", e.target.value)}
        disabled={pending}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Select
        defaultValue={initial.course ?? ""}
        onChange={(e) => update("course", e.target.value)}
        disabled={pending}
      >
        <option value="">All courses</option>
        {courses.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select
        defaultValue={initial.semester ?? ""}
        onChange={(e) => update("semester", e.target.value)}
        disabled={pending}
      >
        <option value="">All semesters</option>
        {semesters.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </div>
  );
}

// Shared URL-driven filter parsing for /admin/students + CSV export.
// Keeps the list page, CSV route, and bulk email all in sync.

export type StudentFilters = {
  search?: string;
  status?: string;
  course?: string;
  semester?: string;
  page: number;
  pageSize: number;
};

export function parseStudentFilters(
  sp: Record<string, string | string[] | undefined>
): StudentFilters {
  const get = (k: string) =>
    typeof sp[k] === "string" && (sp[k] as string).length > 0
      ? (sp[k] as string)
      : undefined;
  const page = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(get("ps") ?? "25", 10) || 25));
  return {
    search: get("q"),
    status: get("status"),
    course: get("course"),
    semester: get("semester"),
    page,
    pageSize,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildWhereClause(f: StudentFilters): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (f.status) where.status = f.status;
  if (f.course) where.course = f.course;
  if (f.semester) where.semester = f.semester;
  if (f.search) {
    const q = f.search.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { registrationId: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export function buildSearchParams(f: Partial<StudentFilters>): string {
  const sp = new URLSearchParams();
  if (f.search) sp.set("q", f.search);
  if (f.status) sp.set("status", f.status);
  if (f.course) sp.set("course", f.course);
  if (f.semester) sp.set("semester", f.semester);
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  if (f.pageSize && f.pageSize !== 25) sp.set("ps", String(f.pageSize));
  return sp.toString();
}

export const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "HOLD", label: "Hold" },
  { value: "RE_INTERVIEW", label: "Re-interview" },
  { value: "SELECTED", label: "Selected" },
  { value: "REJECTED", label: "Rejected" },
] as const;

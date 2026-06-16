import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { InternStatusBadge, DepartmentBadge } from "./InternBadges";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InternsPage({ searchParams }: PageProps) {
  await requireRole("SUPER_ADMIN");
  const sp = await searchParams;

  // Parse filters
  const status = sp.status ? (sp.status as string).split(",") : [];
  const department = sp.department ? (sp.department as string).split(",") : [];
  const page = parseInt((sp.page as string) || "1", 10);
  const pageSize = 25;

  // Build where clause
  const where: any = {};
  if (status.length > 0) where.status = { in: status };
  if (department.length > 0) where.department = { in: department };

  // Fetch data
  const [interns, total, departments] = await Promise.all([
    prisma.intern.findMany({
      where,
      select: {
        id: true,
        internId: true,
        fullName: true,
        personalEmail: true,
        department: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        period: {
          select: { endDate: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.intern.count({ where }),
    prisma.intern
      .findMany({
        select: { department: true },
        distinct: ["department"],
      })
      .then((rs) => rs.map((r) => r.department).sort()),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Status counts
  const statusCounts = await prisma.intern.groupBy({
    by: ["status"],
    _count: true,
  });

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Interns</h1>
        <p className="mt-1 text-sm text-brand-muted">
          {total.toLocaleString()} intern{total === 1 ? "" : "s"} registered
        </p>
      </header>

      {/* Status Summary */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {["PENDING_VERIFICATION", "ACTIVE", "INACTIVE", "COMPLETED"].map(
          (s) => {
            const count = statusCounts.find((sc) => sc.status === s)?._count || 0;
            return (
              <div
                key={s}
                className="rounded-lg border border-brand-border bg-brand-surface p-4"
              >
                <p className="text-xs uppercase tracking-widest text-brand-muted">
                  {s.replace(/_/g, " ")}
                </p>
                <p className="mt-2 text-2xl font-bold text-brand-text">
                  {count}
                </p>
              </div>
            );
          }
        )}
      </div>

      {/* Filters */}
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
              const params = new URLSearchParams(sp as any);
              params.delete("page");
              if (selected.length > 0) {
                params.set("status", selected.join(","));
              } else {
                params.delete("status");
              }
              window.location.search = params.toString();
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
              const params = new URLSearchParams(sp as any);
              params.delete("page");
              if (selected.length > 0) {
                params.set("department", selected.join(","));
              } else {
                params.delete("department");
              }
              window.location.search = params.toString();
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

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
        <table className="w-full text-sm">
          <thead className="bg-brand-bg text-left text-xs uppercase tracking-widest text-brand-muted">
            <tr>
              <th className="px-4 py-3">Intern ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Signed Up</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {interns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-muted">
                  No interns match current filters
                </td>
              </tr>
            ) : (
              interns.map((intern) => (
                <tr key={intern.id} className="hover:bg-brand-bg/50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/interns/${intern.id}`}
                      className="text-brand-blue hover:underline"
                    >
                      {intern.internId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-text">
                    {intern.fullName}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{intern.personalEmail}</td>
                  <td className="px-4 py-3">
                    <DepartmentBadge department={intern.department} />
                  </td>
                  <td className="px-4 py-3">
                    <InternStatusBadge status={intern.status} />
                  </td>
                  <td className="px-4 py-3 text-brand-muted text-xs">
                    {new Date(intern.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {intern.status === "PENDING_VERIFICATION" && (
                        <ApproveButton internId={intern.id} />
                      )}
                      {(intern.status === "ACTIVE" || intern.status === "PENDING_VERIFICATION") && (
                        <DeactivateButton internId={intern.id} />
                      )}
                      <DeleteButton internId={intern.id} name={intern.fullName} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-brand-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}${status.length > 0 ? `&status=${status.join(",")}` : ""}${
                  department.length > 0 ? `&department=${department.join(",")}` : ""
                }`}
                className="rounded-md border border-brand-border px-3 py-2 text-sm font-medium hover:bg-brand-bg"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}${status.length > 0 ? `&status=${status.join(",")}` : ""}${
                  department.length > 0 ? `&department=${department.join(",")}` : ""
                }`}
                className="rounded-md border border-brand-border px-3 py-2 text-sm font-medium hover:bg-brand-bg"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Delete Button ──

function DeleteButton({ internId, name }: { internId: string; name: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await requireRole("SUPER_ADMIN");
        await prisma.intern.delete({ where: { id: internId } });
        revalidatePath("/admin/interns");
      }}
      className="inline"
    >
      <button
        type="submit"
        title={`Permanently delete ${name}`}
        className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}

// ── Approve Button ──

function ApproveButton({ internId }: { internId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await requireRole("SUPER_ADMIN");
        const intern = await prisma.intern.findUnique({ where: { id: internId } });
        if (!intern) return;
        await prisma.intern.update({ where: { id: internId }, data: { status: "ACTIVE" } });
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "noreply@ews.aero",
          to: intern.personalEmail,
          subject: "Your Elite World Services Internship Portal Account Has Been Approved",
          html: `<h2>Account Approved!</h2><p>Hi ${intern.fullName},</p><p>Your internship portal account has been approved. You now have full access to study materials, attendance, and notes.</p><p>Log in at <a href="https://careers.ews.aero/intern/login">careers.ews.aero/intern/login</a></p>`,
        });
        revalidatePath("/admin/interns");
      }}
      className="inline"
    >
      <button
        type="submit"
        className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-white hover:bg-brand-green-dark"
      >
        Approve
      </button>
    </form>
  );
}

// ── Deactivate Button ──

function DeactivateButton({ internId }: { internId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await requireRole("SUPER_ADMIN");
        const intern = await prisma.intern.findUnique({ where: { id: internId } });
        if (!intern) return;
        await prisma.intern.update({ where: { id: internId }, data: { status: "INACTIVE" } });
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "noreply@ews.aero",
          to: intern.personalEmail,
          subject: "Your Elite World Services Internship Portal Access Has Been Deactivated",
          html: `<h2>Account Deactivated</h2><p>Hi ${intern.fullName},</p><p>Your internship portal account has been deactivated. If you believe this is an error, please contact the admin.</p>`,
        });
        revalidatePath("/admin/interns");
      }}
      className="inline"
    >
      <button
        type="submit"
        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        Deactivate
      </button>
    </form>
  );
}

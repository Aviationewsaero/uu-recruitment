import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { InternStatusBadge, DepartmentBadge } from "../InternBadges";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ internId: string }>;
};

export default async function InternDetailPage({ params }: PageProps) {
  await requireRole("SUPER_ADMIN");
  const { internId } = await params;

  const intern = await prisma.intern.findUnique({
    where: { id: internId },
    include: {
      period: true,
      progress: true,
      attendance: true,
    },
  });

  if (!intern) notFound();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/admin/interns" className="text-sm text-brand-blue hover:underline">
            ← Back to Interns
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-brand-text">{intern.fullName}</h1>
          <p className="mt-1 font-mono text-sm text-brand-muted">{intern.internId}</p>
        </div>
        <InternStatusBadge status={intern.status} />
      </div>

      {/* Grid of sections */}
      <div className="grid grid-cols-2 gap-6">
        {/* Personal */}
        <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
          <h2 className="text-lg font-semibold text-brand-text">Personal</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-muted">Email</dt>
              <dd className="text-brand-text">{intern.personalEmail}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Phone</dt>
              <dd className="text-brand-text">{intern.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Date of Birth</dt>
              <dd className="text-brand-text">
                {intern.dateOfBirth
                  ? new Date(intern.dateOfBirth).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Gender</dt>
              <dd className="text-brand-text">{intern.gender}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Blood Group</dt>
              <dd className="text-brand-text">{intern.bloodGroup || "—"}</dd>
            </div>
          </dl>
        </section>

        {/* University */}
        <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
          <h2 className="text-lg font-semibold text-brand-text">University</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-muted">Department</dt>
              <dd>
                <DepartmentBadge department={intern.department} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Enrollment #</dt>
              <dd className="text-brand-text">{intern.enrollmentNumber || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Batch Year</dt>
              <dd className="text-brand-text">{intern.batchYear || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Current Semester</dt>
              <dd className="text-brand-text">{intern.currentSemester || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Expected Graduation</dt>
              <dd className="text-brand-text">{intern.expectedGraduation || "—"}</dd>
            </div>
          </dl>
        </section>

        {/* Education */}
        <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
          <h2 className="text-lg font-semibold text-brand-text">Education</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-muted">Class 10 Board</dt>
              <dd className="text-brand-text">{intern.class10Board || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Class 10 %</dt>
              <dd className="text-brand-text">{intern.class10Percent ? String(intern.class10Percent) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Class 12 Board</dt>
              <dd className="text-brand-text">{intern.class12Board || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Class 12 %</dt>
              <dd className="text-brand-text">{intern.class12Percent ? String(intern.class12Percent) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Current CGPA</dt>
              <dd className="text-brand-text">{intern.currentCgpa ? String(intern.currentCgpa) : "—"}</dd>
            </div>
          </dl>
        </section>

        {/* Internship */}
        <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
          <h2 className="text-lg font-semibold text-brand-text">Internship Period</h2>
          {intern.period ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-muted">Start Date</dt>
                <dd className="text-brand-text">
                  {new Date(intern.period.startDate).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-muted">End Date</dt>
                <dd className="text-brand-text">
                  {new Date(intern.period.endDate).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-muted">Duration</dt>
                <dd className="text-brand-text">{intern.period.durationWeeks} weeks</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-muted">Stipend</dt>
                <dd className="text-brand-text">
                  {intern.period.stipendPerMonth ? `₹${String(intern.period.stipendPerMonth)}/mo` : "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-brand-muted">Not set</p>
          )}
        </section>

        {/* Emergency Contact */}
        <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
          <h2 className="text-lg font-semibold text-brand-text">Emergency Contact</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-muted">Name</dt>
              <dd className="text-brand-text">{intern.emergencyContactName || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Relation</dt>
              <dd className="text-brand-text">{intern.emergencyContactRelation || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Phone</dt>
              <dd className="text-brand-text">{intern.emergencyContactPhone || "—"}</dd>
            </div>
          </dl>
        </section>

        {/* Admin Actions */}
        <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
          <h2 className="text-lg font-semibold text-brand-text">Admin Actions</h2>
          <div className="mt-4 space-y-2">
            {intern.status === "PENDING_VERIFICATION" && (
              <form
                action={async () => {
                  "use server";
                  await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/admin/interns/${internId}/approve`,
                    { method: "POST" }
                  );
                }}
              >
                <button
                  type="submit"
                  className="w-full rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark"
                >
                  ✓ Approve Intern
                </button>
              </form>
            )}
            {(intern.status === "ACTIVE" || intern.status === "PENDING_VERIFICATION") && (
              <form
                action={async () => {
                  "use server";
                  await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/admin/interns/${internId}/deactivate`,
                    { method: "POST" }
                  );
                }}
              >
                <button
                  type="submit"
                  className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  ✗ Deactivate Intern
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Metadata */}
        <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
          <h2 className="text-lg font-semibold text-brand-text">Metadata</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-muted">Status</dt>
              <dd className="text-brand-text">{intern.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Email Verified</dt>
              <dd className="text-brand-text">
                {intern.emailVerifiedAt ? "Yes" : "No"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Signed Up</dt>
              <dd className="text-brand-text">
                {new Date(intern.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Last Login</dt>
              <dd className="text-brand-text">
                {intern.lastLoginAt
                  ? new Date(intern.lastLoginAt).toLocaleDateString()
                  : "Never"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

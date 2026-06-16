import Link from "next/link";
import { requireActiveIntern } from "@/lib/auth-intern";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Dashboard - Intern Portal",
};

export default async function InternDashboardPage() {
  const { intern } = await requireActiveIntern();

  // Fetch materials available to this intern's department
  const materials = await prisma.studyMaterial.findMany({
    where: {
      isActive: true,
      OR: [
        { audienceDepartments: null }, // available to all
        { audienceDepartments: { contains: intern.department } },
      ],
    },
    include: {
      _count: { select: { slides: true } },
      progress: {
        where: { internId: intern.id },
        take: 1,
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  // Fetch attendance stats for this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const attendance = await prisma.internAttendance.findMany({
    where: {
      internId: intern.id,
      date: { gte: monthStart },
    },
    orderBy: { date: "desc" },
  });

  // Fetch notepad
  const notepad = await prisma.internNotepad.findUnique({
    where: { internId: intern.id },
  });

  const daysPresent = attendance.length;
  const attendancePercentage = 100; // Placeholder, will be calculated per-month

  return (
    <div className="flex min-h-screen flex-col bg-brand-background">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-surface px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-muted">
              Welcome back
            </p>
            <h1 className="mt-1 text-2xl font-bold text-brand-text">{intern.fullName}</h1>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/intern/profile"
              className="rounded-md border border-brand-border px-4 py-2 text-sm font-medium hover:bg-brand-bg"
            >
              Profile
            </Link>
            <form
              action={async () => {
                "use server";
                const { clearInternSessionCookie } = await import("@/lib/intern-session");
                await clearInternSessionCookie();
                const { redirect } = await import("next/navigation");
                redirect("/intern/login");
              }}
              className="inline"
            >
              <button
                type="submit"
                className="rounded-md border border-brand-border px-4 py-2 text-sm font-medium hover:bg-brand-bg"
              >
                Log Out
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
              <p className="text-xs uppercase tracking-widest text-brand-muted">
                Internship Status
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-green">Active</p>
              {intern.period && (
                <p className="mt-2 text-xs text-brand-muted">
                  Ends {new Date(intern.period.endDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
              <p className="text-xs uppercase tracking-widest text-brand-muted">
                This Month
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-text">{daysPresent}</p>
              <p className="mt-2 text-xs text-brand-muted">days marked</p>
            </div>

            <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
              <p className="text-xs uppercase tracking-widest text-brand-muted">
                Materials
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-text">{materials.length}</p>
              <p className="mt-2 text-xs text-brand-muted">available to you</p>
            </div>
          </div>

          {/* Study Materials */}
          <section>
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-text">Study Materials</h2>
            </header>

            {materials.length === 0 ? (
              <div className="rounded-lg border border-brand-border bg-brand-surface p-8 text-center">
                <p className="text-brand-muted">
                  No study materials available yet. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {materials.map((material) => {
                  const progress = material.progress[0];
                  const viewedPercent = progress
                    ? Math.round((progress.slidesViewed / material.totalSlides) * 100)
                    : 0;

                  return (
                    <Link
                      key={material.id}
                      href={`/intern/materials/${material.slug}`}
                      className="group rounded-lg border border-brand-border bg-brand-surface p-5 hover:border-brand-blue hover:bg-brand-bg transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-brand-text group-hover:text-brand-blue">
                            {material.title}
                          </h3>
                          {material.description && (
                            <p className="mt-1 text-sm text-brand-muted">
                              {material.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-brand-muted">
                            {material.totalSlides} slides
                            {progress && ` • ${viewedPercent}% complete`}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium text-brand-text">
                            {viewedPercent}%
                          </p>
                          <div className="mt-2 h-2 w-20 rounded-full bg-brand-bg overflow-hidden">
                            <div
                              className="h-full bg-brand-green transition-all"
                              style={{ width: `${viewedPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Notepad Preview */}
          <section>
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-text">Your Notes</h2>
              <Link
                href="/intern/notepad"
                className="text-sm text-brand-blue hover:underline"
              >
                Edit →
              </Link>
            </header>

            <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
              {notepad && notepad.content ? (
                <div className="prose prose-sm max-h-32 overflow-y-auto text-sm text-brand-text">
                  <p>{notepad.content.substring(0, 200)}...</p>
                </div>
              ) : (
                <p className="text-brand-muted">
                  No notes yet.{" "}
                  <Link href="/intern/notepad" className="text-brand-blue hover:underline">
                    Start writing
                  </Link>
                </p>
              )}
            </div>
          </section>

          {/* Attendance Tip */}
          <section className="rounded-lg border border-brand-border bg-brand-green/10 p-6">
            <h3 className="font-semibold text-brand-text">Daily Attendance</h3>
            <p className="mt-2 text-sm text-brand-muted">
              Log in daily to mark your attendance. Your internship requires regular presence.
            </p>
            <Link
              href="/intern/attendance"
              className="mt-3 inline-block rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark"
            >
              View Attendance Log
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

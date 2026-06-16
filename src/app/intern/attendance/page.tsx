import Link from "next/link";
import { requireActiveIntern } from "@/lib/auth-intern";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Attendance - Intern Portal",
};

export default async function AttendancePage() {
  const { intern } = await requireActiveIntern();

  // Fetch attendance for current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const attendance = await prisma.internAttendance.findMany({
    where: {
      internId: intern.id,
      date: {
        gte: monthStart,
        lt: monthEnd,
      },
    },
    orderBy: { date: "desc" },
  });

  const daysPresent = attendance.length;
  const daysInMonth = Math.floor((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
  const attendance_pct = daysInMonth > 0 ? Math.round((daysPresent / daysInMonth) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-brand-background">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-surface px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <Link href="/intern/dashboard" className="text-sm text-brand-blue hover:underline">
              ← Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-brand-text">Attendance Log</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Track your internship attendance
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
              <p className="text-xs uppercase tracking-widest text-brand-muted">
                Days Present (This Month)
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-text">{daysPresent}</p>
              <p className="mt-1 text-xs text-brand-muted">out of {daysInMonth} days</p>
            </div>

            <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
              <p className="text-xs uppercase tracking-widest text-brand-muted">
                Attendance Rate
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-green">{attendance_pct}%</p>
            </div>

            <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
              <p className="text-xs uppercase tracking-widest text-brand-muted">
                Total Sessions
              </p>
              <div className="mt-2">
                <p className="text-2xl font-bold text-brand-text">
                  {Math.floor(await prisma.internAttendance.count({ where: { internId: intern.id } }))}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Log */}
          <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-bg text-left text-xs uppercase tracking-widest text-brand-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Check-In Time</th>
                  <th className="px-4 py-3">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-brand-muted">
                      No attendance records for this month
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-brand-bg/50">
                      <td className="px-4 py-3 font-medium">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-brand-muted">
                        {record.checkedInAt.toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand-green/15 px-3 py-1 text-xs text-brand-green-dark">
                          {record.method === "CHECK_IN"
                            ? "Manual"
                            : record.method === "AUTO"
                            ? "Auto (Login)"
                            : "Admin"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Info */}
          <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
            <p className="text-xs text-brand-muted">
              💡 <strong>Note:</strong> Attendance is automatically tracked when you log in. Your
              attendance record is important for your internship completion and is shared with your
              university mentor.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

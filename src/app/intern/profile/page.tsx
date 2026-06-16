import Link from "next/link";
import { requireActiveIntern } from "@/lib/auth-intern";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Profile - Intern Portal",
};

export default async function InternProfilePage() {
  const { intern } = await requireActiveIntern();

  return (
    <div className="flex min-h-screen flex-col bg-brand-background">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-surface px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <Link href="/intern/dashboard" className="text-sm text-brand-blue hover:underline">
              ← Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-brand-text">Your Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Personal Information */}
          <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
            <h2 className="text-lg font-semibold text-brand-text">Personal Information</h2>
            <dl className="mt-6 grid grid-cols-2 gap-6 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-widest text-brand-muted">
                  Intern ID
                </dt>
                <dd className="mt-1 font-mono font-medium text-brand-text">
                  {intern.internId}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-brand-muted">
                  Full Name
                </dt>
                <dd className="mt-1 font-medium text-brand-text">{intern.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-brand-muted">Email</dt>
                <dd className="mt-1 text-brand-text">{intern.personalEmail}</dd>
              </div>
              {intern.collegeEmail && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    College Email
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.collegeEmail}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-widest text-brand-muted">Phone</dt>
                <dd className="mt-1 text-brand-text">{intern.phone}</dd>
              </div>
              {intern.alternatePhone && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Alternate Phone
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.alternatePhone}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-widest text-brand-muted">
                  Date of Birth
                </dt>
                <dd className="mt-1 text-brand-text">
                  {intern.dateOfBirth
                    ? new Date(intern.dateOfBirth).toLocaleDateString()
                    : "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-brand-muted">Gender</dt>
                <dd className="mt-1 text-brand-text">{intern.gender}</dd>
              </div>
              {intern.bloodGroup && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Blood Group
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.bloodGroup}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* University Information */}
          <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
            <h2 className="text-lg font-semibold text-brand-text">University Information</h2>
            <dl className="mt-6 grid grid-cols-2 gap-6 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-widest text-brand-muted">
                  Department
                </dt>
                <dd className="mt-1 font-medium text-brand-text">
                  {intern.department.replace(/_/g, " ")}
                </dd>
              </div>
              {intern.enrollmentNumber && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Enrollment Number
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.enrollmentNumber}</dd>
                </div>
              )}
              {intern.batchYear && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Batch Year
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.batchYear}</dd>
                </div>
              )}
              {intern.currentSemester && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Current Semester
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.currentSemester}</dd>
                </div>
              )}
              {intern.expectedGraduation && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Expected Graduation
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.expectedGraduation}</dd>
                </div>
              )}
              {intern.currentCgpa && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Current CGPA
                  </dt>
                  <dd className="mt-1 text-brand-text">{String(intern.currentCgpa)}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Education History */}
          <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
            <h2 className="text-lg font-semibold text-brand-text">Education History</h2>
            <dl className="mt-6 grid grid-cols-2 gap-6 text-sm">
              {intern.class10Board && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Class 10 Board
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.class10Board}</dd>
                </div>
              )}
              {intern.class10Percent && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Class 10 Percentage
                  </dt>
                  <dd className="mt-1 text-brand-text">{String(intern.class10Percent)}</dd>
                </div>
              )}
              {intern.class12Board && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Class 12 Board
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.class12Board}</dd>
                </div>
              )}
              {intern.class12Stream && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Class 12 Stream
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.class12Stream}</dd>
                </div>
              )}
              {intern.class12Percent && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Class 12 Percentage
                  </dt>
                  <dd className="mt-1 text-brand-text">{String(intern.class12Percent)}</dd>
                </div>
              )}
              {intern.ugCourse && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Undergraduate Course
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.ugCourse}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Emergency Contact */}
          {intern.emergencyContactName && (
            <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
              <h2 className="text-lg font-semibold text-brand-text">Emergency Contact</h2>
              <dl className="mt-6 grid grid-cols-2 gap-6 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">Name</dt>
                  <dd className="mt-1 text-brand-text">{intern.emergencyContactName}</dd>
                </div>
                {intern.emergencyContactRelation && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-brand-muted">
                      Relation
                    </dt>
                    <dd className="mt-1 text-brand-text">
                      {intern.emergencyContactRelation}
                    </dd>
                  </div>
                )}
                {intern.emergencyContactPhone && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-brand-muted">
                      Phone
                    </dt>
                    <dd className="mt-1 text-brand-text">
                      {intern.emergencyContactPhone}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Internship Period */}
          {intern.period && (
            <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
              <h2 className="text-lg font-semibold text-brand-text">Internship Period</h2>
              <dl className="mt-6 grid grid-cols-2 gap-6 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Start Date
                  </dt>
                  <dd className="mt-1 text-brand-text">
                    {new Date(intern.period.startDate).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    End Date
                  </dt>
                  <dd className="mt-1 text-brand-text">
                    {new Date(intern.period.endDate).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-muted">
                    Duration
                  </dt>
                  <dd className="mt-1 text-brand-text">{intern.period.durationWeeks} weeks</dd>
                </div>
                {intern.period.stipendPerMonth && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-brand-muted">
                      Monthly Stipend
                    </dt>
                    <dd className="mt-1 text-brand-text">
                      ₹{String(intern.period.stipendPerMonth)}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

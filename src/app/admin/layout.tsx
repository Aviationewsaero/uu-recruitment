import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth-user";
import { logoutAction } from "@/lib/admin/actions";

// Admin console must never be indexed by search engines, even though
// the root layout now allows indexing for the public careers landing.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV: { href: string; label: string; roles: string[] }[] = [
  { href: "/admin/live", label: "Live Monitor", roles: ["SUPER_ADMIN"] },
  { href: "/admin", label: "Overview", roles: ["SUPER_ADMIN", "DESK_OPERATOR", "EMAIL_MANAGER"] },
  { href: "/admin/queue", label: "Live Queue", roles: ["SUPER_ADMIN", "DESK_OPERATOR"] },
  { href: "/admin/students", label: "Students", roles: ["SUPER_ADMIN", "EMAIL_MANAGER"] },
  { href: "/admin/interns", label: "Interns", roles: ["SUPER_ADMIN"] },
  { href: "/admin/materials", label: "Study Materials", roles: ["SUPER_ADMIN"] },
  { href: "/admin/emails", label: "Bulk Email", roles: ["SUPER_ADMIN", "EMAIL_MANAGER"] },
  { href: "/admin/analytics", label: "Analytics", roles: ["SUPER_ADMIN"] },
  { href: "/admin/status-report", label: "Status Report", roles: ["SUPER_ADMIN"] },
  { href: "/admin/users", label: "Staff Accounts", roles: ["SUPER_ADMIN"] },
  { href: "/admin/rooms", label: "Rooms", roles: ["SUPER_ADMIN"] },
  { href: "/admin/qr-poster", label: "QR Poster", roles: ["SUPER_ADMIN", "DESK_OPERATOR"] },
  { href: "/admin/runbook", label: "Runbook", roles: ["SUPER_ADMIN", "DESK_OPERATOR"] },
  { href: "/admin/email-test", label: "Email Diagnostic", roles: ["SUPER_ADMIN"] },
  { href: "/admin/data-reset", label: "Reset Drive Data", roles: ["SUPER_ADMIN"] },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page renders without the chrome
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (pathname.endsWith("/login")) return <>{children}</>;

  const user = await getCurrentUser();
  if (!user) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-brand-border bg-brand-surface flex flex-col">
        <div className="px-5 py-5 border-b border-brand-border">
          <p className="text-[10px] uppercase tracking-widest text-brand-muted">
            EWS · Aviation
          </p>
          <p className="mt-1 text-sm font-semibold text-brand-text">
            Admin Console
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm text-brand-text hover:bg-brand-bg"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-brand-border">
          <p className="px-3 text-xs text-brand-muted truncate">
            {user.email}
          </p>
          <p className="px-3 text-[10px] uppercase tracking-widest text-brand-muted mt-0.5">
            {user.role.replace("_", " ")}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-3 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-brand-bg"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-brand-bg">{children}</main>
    </div>
  );
}

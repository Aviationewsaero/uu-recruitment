import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth-user";
import { logoutAction } from "@/lib/admin/actions";
import { prisma } from "@/lib/prisma";

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (pathname.endsWith("/login")) return <>{children}</>;

  const user = await getCurrentUser();
  if (!user) return <>{children}</>;

  // Show assigned room in the header chip
  const room = await prisma.room.findFirst({
    where: { recruiterId: user.userId, active: true },
  });

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <header className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-muted">
                EWS · Aviation
              </p>
              <p className="text-sm font-semibold text-brand-text">
                Recruiter Console
              </p>
            </div>
            {room && (
              <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-green-dark">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                {room.displayName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-muted">{user.email}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-brand-bg"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

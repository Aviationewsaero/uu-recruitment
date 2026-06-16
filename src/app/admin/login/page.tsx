import { AdminLoginFlow } from "./AdminLoginFlow";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center py-10">
      <div className="w-full max-w-md px-6">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-widest text-brand-muted">
            Elite World Services Limited
          </p>
          <h1 className="mt-1 text-2xl font-bold text-brand-text">
            Staff sign-in
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            For recruiters, desk operators, and admins.
          </p>
        </div>
        <AdminLoginFlow />
      </div>
    </main>
  );
}

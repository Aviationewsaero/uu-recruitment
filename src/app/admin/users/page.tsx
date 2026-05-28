import { requireRole } from "@/lib/auth-user";
import { listStaff, listRooms } from "@/lib/users/service";
import { UsersList } from "./UsersList";
import { CreateUserForm } from "./CreateUserForm";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireRole("SUPER_ADMIN");
  const [staff, rooms] = await Promise.all([listStaff(), listRooms()]);

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Staff accounts</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Create logins for recruiters, desk operators, and email managers.
          They log in at <code>/admin/login</code> with email + password — no
          OTP, no waiting for email.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-muted">
          Add a new staff account
        </h2>
        <CreateUserForm />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-muted">
          Existing staff ({staff.length})
        </h2>
        <p className="mb-3 text-xs text-brand-muted">
          Recruiters need a <strong>room assigned</strong> before they can call
          tokens — pick one from the dropdown in their row.
        </p>
        <UsersList staff={staff} rooms={rooms} myId={me.userId} />
      </section>
    </div>
  );
}

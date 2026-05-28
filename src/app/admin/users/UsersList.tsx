"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  resetStaffPasswordAction,
  toggleStaffActiveAction,
  deleteStaffAction,
} from "@/lib/users/actions";

type Staff = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  hasPassword: boolean;
  createdAt: Date;
};

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-amber-100 text-amber-800",
  RECRUITER: "bg-brand-green/15 text-brand-green-dark",
  DESK_OPERATOR: "bg-brand-blue/15 text-brand-blue",
  EMAIL_MANAGER: "bg-purple-100 text-purple-700",
};

export function UsersList({ staff, myId }: { staff: Staff[]; myId: string }) {
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const runAction = (
    action: (prev: unknown, fd: FormData) => Promise<{ ok: boolean; error?: string; message?: string }>,
    fields: Record<string, string>,
    successMsg: string
  ) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
    start(async () => {
      const r = await action(null, fd);
      if (!r.ok) toast.error(r.error ?? "Failed");
      else {
        toast.success(r.message ?? successMsg);
        router.refresh();
        setResettingId(null);
        setNewPassword("");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
      <table className="w-full text-sm">
        <thead className="bg-brand-bg text-left text-xs uppercase tracking-widest text-brand-muted">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email (login)</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((u) => {
            const isMe = u.id === myId;
            return (
              <tr key={u.id} className="border-t border-brand-border align-top">
                <td className="px-4 py-3 font-medium text-brand-text">
                  {u.fullName} {isMe && <span className="text-xs text-brand-muted">(you)</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-brand-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[u.role] ?? "bg-brand-bg"}`}>
                    {u.role.replace("_", " ").toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {u.active ? (
                    <span className="text-brand-green-dark">● active</span>
                  ) : (
                    <span className="text-brand-muted">○ inactive</span>
                  )}
                  {!u.hasPassword && (
                    <span className="ml-2 text-amber-600">· no password set</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {resettingId === u.id ? (
                    <div className="inline-flex gap-1 items-center">
                      <Input
                        type="text"
                        placeholder="New password (min 8)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-44 h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          runAction(
                            resetStaffPasswordAction,
                            { userId: u.id, password: newPassword },
                            "Password updated"
                          )
                        }
                        disabled={pending || newPassword.length < 8}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResettingId(null);
                          setNewPassword("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResettingId(u.id);
                          setNewPassword("");
                        }}
                      >
                        Reset password
                      </Button>
                      {!isMe && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            runAction(
                              toggleStaffActiveAction,
                              { userId: u.id, active: u.active ? "false" : "true" },
                              u.active ? "Deactivated" : "Activated"
                            )
                          }
                          disabled={pending}
                        >
                          {u.active ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                      {!isMe && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (!confirm(`Deactivate ${u.email}? (Historical data is kept; account just can't log in.)`)) return;
                            runAction(deleteStaffAction, { userId: u.id }, "Removed");
                          }}
                          disabled={pending}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {staff.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-brand-muted">
                No staff yet. Add one above to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

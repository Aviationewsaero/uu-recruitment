"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { FormField, Label, FieldError, FieldHint, FormRow } from "@/components/ui/Form";
import { createStaffAction } from "@/lib/users/actions";

const ROLE_OPTIONS = [
  { value: "RECRUITER", label: "Recruiter — conducts interviews" },
  { value: "DESK_OPERATOR", label: "Desk Operator — manages queue" },
  { value: "EMAIL_MANAGER", label: "Email Manager — bulk comms + student list" },
  { value: "SUPER_ADMIN", label: "Super Admin — full access (use sparingly)" },
];

export function CreateUserForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await createStaffAction(null, fd);
          if (!r.ok) {
            setError(r.error);
            toast.error(r.error);
            return;
          }
          toast.success(r.message ?? "Staff created");
          form.reset();
        });
      }}
      className="rounded-xl border border-brand-border bg-brand-surface p-6"
    >
      <FormRow cols={2}>
        <FormField>
          <Label required>Full name</Label>
          <Input
            name="fullName"
            required
            disabled={pending}
            placeholder="e.g. Priya Sharma"
            autoComplete="off"
          />
        </FormField>
        <FormField>
          <Label required>Email</Label>
          <Input
            name="email"
            type="email"
            required
            disabled={pending}
            placeholder="priya@ews.aero"
            autoComplete="off"
          />
          <FieldHint>
            Will be used to log in. Doesn&apos;t need to be a working mailbox.
          </FieldHint>
        </FormField>
      </FormRow>

      <FormRow cols={2} >
        <FormField>
          <Label required>Role</Label>
          <Select name="role" defaultValue="RECRUITER" disabled={pending}>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField>
          <Label required>Password</Label>
          <div className="flex gap-2">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={pending}
              minLength={8}
              placeholder="At least 8 chars · letter + digit"
              autoComplete="new-password"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowPassword((v) => !v)}
              disabled={pending}
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
          <FieldHint>
            Tell the staff member this password verbally — they can change it
            (well, you can reset it for them) later.
          </FieldHint>
        </FormField>
      </FormRow>

      <FieldError message={error ?? undefined} />

      <Button type="submit" size="lg" className="mt-4" disabled={pending}>
        {pending ? "Creating…" : "Create staff account →"}
      </Button>
    </form>
  );
}

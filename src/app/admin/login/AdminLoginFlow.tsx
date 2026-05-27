"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label, FieldError, FieldHint, FormField } from "@/components/ui/Form";
import {
  adminRequestOtpAction,
  adminVerifyOtpAction,
} from "@/lib/admin/actions";

const ROLE_LANDING: Record<string, string> = {
  RECRUITER: "/recruiter",
  DESK_OPERATOR: "/admin/queue",
  SUPER_ADMIN: "/admin",
  EMAIL_MANAGER: "/admin",
};

export function AdminLoginFlow() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = search.get("next");

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      {step === "email" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const r = await adminRequestOtpAction(null, fd);
              if (!r.ok) return setError(r.error);
              setEmail(r.email);
              setStep("otp");
              toast.success("Code sent — check your inbox (or dev console)");
            });
          }}
        >
          <FormField>
            <Label htmlFor="email" required>
              Staff email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
              placeholder="you@ews.aero"
            />
            <FieldHint>
              Must be a pre-provisioned staff account. Contact admin if you
              need access.
            </FieldHint>
            <FieldError message={error ?? undefined} />
          </FormField>
          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={pending}
          >
            {pending ? "Sending…" : "Send code →"}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            fd.set("email", email);
            start(async () => {
              const r = await adminVerifyOtpAction(null, fd);
              if (!r.ok) return setError(r.error);
              toast.success("Welcome back");
              router.push(nextUrl ?? ROLE_LANDING[r.role] ?? "/admin");
              router.refresh();
            });
          }}
        >
          <p className="mb-4 text-sm text-brand-muted">
            Code sent to <strong className="text-brand-text">{email}</strong>.{" "}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="text-brand-blue underline-offset-2 hover:underline"
            >
              Change email
            </button>
          </p>
          <FormField>
            <Label htmlFor="code" required>
              6-digit code
            </Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              required
              placeholder="000000"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              disabled={pending}
            />
            <FieldError message={error ?? undefined} />
          </FormField>
          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={pending}
          >
            {pending ? "Verifying…" : "Sign in →"}
          </Button>
        </form>
      )}
    </div>
  );
}

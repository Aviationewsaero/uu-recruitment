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
  adminPasswordLoginAction,
} from "@/lib/admin/actions";

const ROLE_LANDING: Record<string, string> = {
  RECRUITER: "/recruiter",
  DESK_OPERATOR: "/admin/queue",
  SUPER_ADMIN: "/admin",
  EMAIL_MANAGER: "/admin",
};

type Mode = "otp-email" | "otp-code" | "password";

export function AdminLoginFlow() {
  const [mode, setMode] = useState<Mode>("otp-email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = search.get("next");

  const goAfterLogin = (role: string) => {
    router.push(nextUrl ?? ROLE_LANDING[role] ?? "/admin");
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      {/* ─── OTP step 1: email ────────────────────────────────────────────── */}
      {mode === "otp-email" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const r = await adminRequestOtpAction(null, fd);
              if (!r.ok) return setError(r.error);
              setEmail(r.email);
              setMode("otp-code");
              toast.success("Code sent — check your inbox");
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

          {/* Break-glass affordance */}
          <div className="mt-5 pt-4 border-t border-brand-border text-center">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              className="text-xs text-brand-muted hover:text-brand-text underline-offset-2 hover:underline"
            >
              Super admin · sign in with password
            </button>
          </div>
        </form>
      )}

      {/* ─── OTP step 2: code ─────────────────────────────────────────────── */}
      {mode === "otp-code" && (
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
              goAfterLogin(r.role);
            });
          }}
        >
          <p className="mb-4 text-sm text-brand-muted">
            Code sent to <strong className="text-brand-text">{email}</strong>.{" "}
            <button
              type="button"
              onClick={() => {
                setMode("otp-email");
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

      {/* ─── Break-glass: password login (super admin only) ───────────────── */}
      {mode === "password" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const r = await adminPasswordLoginAction(null, fd);
              if (!r.ok) return setError(r.error);
              toast.success("Signed in (password)");
              goAfterLogin(r.role);
            });
          }}
        >
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <strong>Emergency password mode.</strong> Only configured for the
            super admin account. Regular staff: please use OTP instead.
          </div>

          <FormField>
            <Label htmlFor="pw-email" required>
              Super admin email
            </Label>
            <Input
              id="pw-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
              placeholder="bhupender@eliteworldservices.com"
            />
          </FormField>
          <FormField>
            <Label htmlFor="pw-password" required>
              Password
            </Label>
            <Input
              id="pw-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
              placeholder="••••••••••••"
            />
            <FieldError message={error ?? undefined} />
          </FormField>
          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={pending}
          >
            {pending ? "Signing in…" : "Sign in with password →"}
          </Button>

          <div className="mt-5 pt-4 border-t border-brand-border text-center">
            <button
              type="button"
              onClick={() => {
                setMode("otp-email");
                setError(null);
              }}
              className="text-xs text-brand-muted hover:text-brand-text underline-offset-2 hover:underline"
            >
              ← Back to OTP login
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

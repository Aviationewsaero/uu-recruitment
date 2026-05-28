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

type Mode = "password" | "otp-email" | "otp-code";

export function AdminLoginFlow() {
  // Password mode is the primary login path now
  const [mode, setMode] = useState<Mode>("password");
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
      {/* ─── PRIMARY: Password login ────────────────────────────────────── */}
      {mode === "password" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const r = await adminPasswordLoginAction(null, fd);
              if (!r.ok) {
                setError(r.error);
                return;
              }
              toast.success("Signed in");
              goAfterLogin(r.role);
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
          </FormField>
          <FormField>
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
              placeholder="••••••••"
            />
            <FieldHint>
              Password set by your admin when your account was created.
              Contact them if you don&apos;t have it.
            </FieldHint>
            <FieldError message={error ?? undefined} />
          </FormField>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in →"}
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
              No password yet? Use email code instead
            </button>
          </div>
        </form>
      )}

      {/* ─── LEGACY: OTP step 1 ─────────────────────────────────────────── */}
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
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Email-code login (slower, requires working inbox). Use password
            login above for instant access.
          </div>
          <FormField>
            <Label htmlFor="otp-email" required>
              Staff email
            </Label>
            <Input
              id="otp-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
              placeholder="you@ews.aero"
            />
            <FieldError message={error ?? undefined} />
          </FormField>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
            {pending ? "Sending…" : "Send code →"}
          </Button>
          <div className="mt-5 pt-4 border-t border-brand-border text-center">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              className="text-xs text-brand-muted hover:text-brand-text underline-offset-2 hover:underline"
            >
              ← Back to password login
            </button>
          </div>
        </form>
      )}

      {/* ─── LEGACY: OTP step 2 ─────────────────────────────────────────── */}
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
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
            {pending ? "Verifying…" : "Sign in →"}
          </Button>
        </form>
      )}
    </div>
  );
}

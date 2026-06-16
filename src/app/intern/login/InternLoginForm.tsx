"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginInternAction } from "@/lib/intern/login-action";
import { loginReasonMessage } from "@/lib/intern/login-messages";

export function InternLoginForm({ reason }: { reason: string | null }) {
  const message = loginReasonMessage(reason);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    startTransition(async () => {
      const result = await loginInternAction(email, password);
      if (!result.success) {
        setError(result.error || "Login failed");
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-brand-border bg-brand-surface p-8 shadow-lg">
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-muted">
          Uttaranchal University Aviation
        </p>
        <h1 className="mt-2 text-2xl font-bold text-brand-text">Intern Portal</h1>
        <p className="mt-1 text-sm text-brand-muted">Log in to your account</p>
      </header>

      {message && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-text">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-text">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <div className="mt-6 border-t border-brand-border pt-6 text-center">
        <p className="text-sm text-brand-muted">
          Don't have an account?{" "}
          <Link href="/intern/signup" className="font-medium text-brand-blue hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

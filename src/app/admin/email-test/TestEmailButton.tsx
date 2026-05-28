"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendTestEmailAction } from "./actions";

type Result =
  | { ok: true; id: string; provider: string }
  | { ok: false; error: string; provider: string };

export function TestEmailButton({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  return (
    <div>
      <div className="flex gap-2 items-center">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="recipient@example.com"
          className="flex-1"
        />
        <Button
          type="button"
          disabled={pending || !email.includes("@")}
          onClick={() =>
            start(async () => {
              setResult(null);
              const r = await sendTestEmailAction(email);
              setResult(r);
            })
          }
        >
          {pending ? "Sending…" : "Send test email"}
        </Button>
      </div>

      {result && (
        <div
          className={`mt-4 rounded-md border p-4 text-sm ${
            result.ok
              ? "border-brand-green/40 bg-brand-green/5"
              : "border-red-300 bg-red-50"
          }`}
        >
          <p className="font-semibold">
            {result.ok ? "✅ Sent successfully" : "❌ Send failed"}
          </p>
          <dl className="mt-2 grid grid-cols-[120px_1fr] gap-y-1.5 gap-x-3 font-mono text-xs">
            <dt className="text-brand-muted">Provider</dt>
            <dd>{result.provider}</dd>
            {result.ok ? (
              <>
                <dt className="text-brand-muted">Resend id</dt>
                <dd className="break-all">{result.id}</dd>
              </>
            ) : (
              <>
                <dt className="text-brand-muted">Error</dt>
                <dd className="break-all whitespace-pre-wrap">{result.error}</dd>
              </>
            )}
          </dl>
          {result.ok && (
            <p className="mt-3 text-xs text-brand-muted">
              Check the inbox at <strong>{email}</strong> (incl. spam folder)
              within 60 sec.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

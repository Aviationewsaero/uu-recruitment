"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { purgeDriveDataAction } from "./actions";

const CONFIRM_PHRASE = "DELETE";

export function ResetPanel() {
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();

  const canSubmit = typed.trim() === CONFIRM_PHRASE && !pending;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-red-900">
        Type{" "}
        <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs font-bold text-red-700">
          {CONFIRM_PHRASE}
        </code>{" "}
        to confirm:
      </label>
      <Input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={CONFIRM_PHRASE}
        autoComplete="off"
        className="font-mono"
      />
      <Button
        type="button"
        variant="danger"
        disabled={!canSubmit}
        onClick={() =>
          start(async () => {
            const r = await purgeDriveDataAction();
            if (!r.ok) {
              setDone({ ok: false, message: r.error });
              toast.error(r.error);
              return;
            }
            setDone({
              ok: true,
              message: `Purged ${r.studentsDeleted} students, ${r.tokensDeleted} tokens, ${r.interviewsDeleted} interviews, ${r.emailsDeleted} email logs. Sequence reset to 1.`,
            });
            toast.success("Drive data reset complete");
            setTyped("");
            router.refresh();
          })
        }
      >
        {pending ? "Purging…" : "Purge all student data"}
      </Button>

      {done && (
        <div
          className={`mt-3 rounded-md border p-3 text-sm ${
            done.ok
              ? "border-brand-green/40 bg-brand-green/5 text-brand-green-dark"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {done.ok ? "✅ " : "❌ "}
          {done.message}
        </div>
      )}
    </div>
  );
}

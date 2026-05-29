"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { purgeDriveDataAction } from "./actions";

const CONFIRM_PHRASE = "DELETE";

type Counts = {
  students: number;
  tokens: number;
  interviews: number;
  emails: number;
  audits: number;
  lastToken: number;
};

export function ResetPanel({ counts }: { counts: Counts }) {
  // Default: students checked (the most common case), everything else off.
  const [opts, setOpts] = useState({
    students: counts.students > 0,
    emails: false,
    audits: false,
    resetSequence: counts.students > 0, // mirror students by default
  });
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();

  const anyChecked =
    opts.students || opts.emails || opts.audits || opts.resetSequence;
  const canSubmit =
    anyChecked && typed.trim() === CONFIRM_PHRASE && !pending;

  function toggle(key: keyof typeof opts) {
    setOpts((s) => ({ ...s, [key]: !s[key] }));
  }

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-red-900">
          Select what to purge:
        </legend>

        <CheckboxRow
          checked={opts.students}
          onToggle={() => toggle("students")}
          disabled={counts.students === 0}
          label="Student registrations"
          detail={
            counts.students === 0
              ? "Nothing to delete."
              : `Deletes ${counts.students} students, ${counts.tokens} tokens, ${counts.interviews} interview decisions, and clears room-current pointers.`
          }
          tone="danger"
        />

        <CheckboxRow
          checked={opts.emails}
          onToggle={() => toggle("emails")}
          disabled={counts.emails === 0}
          label="Email log history"
          detail={
            counts.emails === 0
              ? "Nothing to delete."
              : `Deletes ${counts.emails} EmailLog rows (Resend message ids + send status).`
          }
          tone="danger"
        />

        <CheckboxRow
          checked={opts.audits}
          onToggle={() => toggle("audits")}
          disabled={counts.audits === 0}
          label="Audit log entries"
          detail={
            counts.audits === 0
              ? "Nothing to delete."
              : `Deletes ${counts.audits} security audit rows (logins, decisions, mutations). The purge itself is re-logged after wipe.`
          }
          tone="danger"
          extraWarning="⚠️ Wipes security trail"
        />

        <CheckboxRow
          checked={opts.resetSequence}
          onToggle={() => toggle("resetSequence")}
          disabled={false}
          label="Reset token sequence to #1"
          detail={`Currently next token would be #${counts.lastToken + 1}. After reset, next becomes #1.`}
          tone="info"
        />
      </fieldset>

      <div className="border-t border-red-200 pt-4">
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
          className="mt-2 font-mono"
          disabled={!anyChecked}
        />
        <Button
          type="button"
          variant="danger"
          className="mt-3"
          disabled={!canSubmit}
          onClick={() =>
            start(async () => {
              const r = await purgeDriveDataAction(opts);
              if (!r.ok) {
                setDone({ ok: false, message: r.error });
                toast.error(r.error);
                return;
              }
              const parts: string[] = [];
              if (r.studentsDeleted)
                parts.push(`${r.studentsDeleted} students`);
              if (r.tokensDeleted)
                parts.push(`${r.tokensDeleted} tokens`);
              if (r.interviewsDeleted)
                parts.push(`${r.interviewsDeleted} interviews`);
              if (r.emailsDeleted)
                parts.push(`${r.emailsDeleted} email rows`);
              if (r.auditsDeleted)
                parts.push(`${r.auditsDeleted} audit rows`);
              if (r.sequenceReset) parts.push("sequence reset to 1");
              setDone({
                ok: true,
                message:
                  parts.length > 0
                    ? `Purged: ${parts.join(" · ")}.`
                    : "Nothing was deleted - all checked categories were already empty.",
              });
              toast.success("Drive data reset complete");
              setTyped("");
              router.refresh();
            })
          }
        >
          {pending ? "Purging…" : "Purge selected categories"}
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
    </div>
  );
}

function CheckboxRow({
  checked,
  onToggle,
  disabled,
  label,
  detail,
  tone,
  extraWarning,
}: {
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
  label: string;
  detail: string;
  tone: "danger" | "info";
  extraWarning?: string;
}) {
  const borderClass = checked
    ? tone === "danger"
      ? "border-red-400 bg-red-100/60"
      : "border-brand-blue/50 bg-brand-blue/5"
    : "border-red-200 bg-white";

  return (
    <label
      className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${borderClass} ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-red-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-700 focus:ring-red-500 disabled:cursor-not-allowed"
      />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-900">
          {label}
          {extraWarning && (
            <span className="ml-2 text-[11px] font-medium text-red-700">
              {extraWarning}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-red-800/80">{detail}</p>
      </div>
    </label>
  );
}

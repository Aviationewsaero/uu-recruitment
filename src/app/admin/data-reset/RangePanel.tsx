"use client";

// Bulk-delete students whose token number falls in [min, max].
// Used to scrub test entries before publishing the status report.
// Always shows a Preview count before the operator commits.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deleteTokenRangeAction, previewTokenRangeAction } from "./actions";

const CONFIRM_PHRASE = "DELETE";

export function RangePanel() {
  const [minToken, setMinToken] = useState("1");
  const [maxToken, setMaxToken] = useState("29");
  const [typed, setTyped] = useState("");
  const [previewing, startPreview] = useTransition();
  const [purging, startPurge] = useTransition();
  const [preview, setPreview] = useState<number | null>(null);
  const [done, setDone] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();

  const validRange =
    minToken.trim() !== "" &&
    maxToken.trim() !== "" &&
    parseInt(minToken, 10) > 0 &&
    parseInt(maxToken, 10) >= parseInt(minToken, 10);

  const canSubmit =
    validRange && preview !== null && preview > 0 && typed.trim() === CONFIRM_PHRASE && !purging;

  function doPreview() {
    startPreview(async () => {
      setDone(null);
      const r = await previewTokenRangeAction({ minToken, maxToken });
      if (!r.ok) {
        setPreview(null);
        toast.error(r.error);
        return;
      }
      setPreview(r.count);
    });
  }

  function doPurge() {
    startPurge(async () => {
      const r = await deleteTokenRangeAction({ minToken, maxToken });
      if (!r.ok) {
        setDone({ ok: false, message: r.error });
        toast.error(r.error);
        return;
      }
      setDone({
        ok: true,
        message: `Deleted ${r.studentsDeleted} students (tokens ${minToken}-${maxToken}), plus ${r.tokensDeleted} tokens, ${r.interviewsDeleted} interview logs, ${r.emailsDeleted} email logs.`,
      });
      toast.success(`Range purge complete - ${r.studentsDeleted} students removed`);
      setTyped("");
      setPreview(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-red-900 mb-1">
            From token #
          </label>
          <Input
            type="number"
            min={1}
            value={minToken}
            onChange={(e) => {
              setMinToken(e.target.value);
              setPreview(null);
            }}
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-red-900 mb-1">
            To token # (inclusive)
          </label>
          <Input
            type="number"
            min={1}
            value={maxToken}
            onChange={(e) => {
              setMaxToken(e.target.value);
              setPreview(null);
            }}
            placeholder="29"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={doPreview}
        disabled={!validRange || previewing}
      >
        {previewing ? "Counting…" : "Preview - how many will be deleted?"}
      </Button>

      {preview !== null && (
        <div
          className={`rounded-md border p-3 text-sm ${
            preview === 0
              ? "border-brand-border bg-brand-bg text-brand-muted"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          {preview === 0 ? (
            <p>No students found with tokens {minToken} - {maxToken}.</p>
          ) : (
            <p>
              <strong>{preview}</strong> student{preview === 1 ? "" : "s"} match
              token range <strong>{minToken}–{maxToken}</strong>. They + their
              interview logs + email log rows will be deleted.
            </p>
          )}
        </div>
      )}

      {preview !== null && preview > 0 && (
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
          />
          <Button
            type="button"
            variant="danger"
            className="mt-3"
            disabled={!canSubmit}
            onClick={doPurge}
          >
            {purging
              ? "Purging…"
              : `Delete ${preview} student${preview === 1 ? "" : "s"} from this range`}
          </Button>
        </div>
      )}

      {done && (
        <div
          className={`rounded-md border p-3 text-sm ${
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

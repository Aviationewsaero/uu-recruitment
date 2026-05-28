"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Textarea, Select } from "@/components/ui/Input";
import { Label, FieldError, FormField } from "@/components/ui/Form";
import { callNextToken, skipToken, markInProgress } from "@/lib/token-engine";
import { submitInterviewDecision } from "@/lib/recruiter/actions";

type StudentSnapshot = {
  id: string;
  registrationId: string;
  fullName: string;
  fatherName: string | null;
  motherName: string | null;
  email: string;
  phone: string;
  gender: string;
  address: string | null;
  course: string;
  semester: string;
  specialization: string | null;
  tenthPercent: string;
  twelfthPercent: string;
  tenthState: string | null;
  twelfthState: string | null;
  graduationCgpa: string | null;
};

type Props = {
  room: { id: string; displayName: string };
  waitingCount: number;
  todayDone: number;
  currentToken:
    | {
        id: string;
        tokenNumber: number;
        status: string;
        calledAt: string | null;
        startedAt: string | null;
        student: StudentSnapshot;
        docs: { photo: string | null; resume: string | null };
      }
    | null;
};

const DECISIONS = [
  { value: "SELECTED", label: "✅ Selected" },
  { value: "SHORTLISTED", label: "📋 Shortlisted" },
  { value: "HOLD", label: "⏸ Hold" },
  { value: "RE_INTERVIEW", label: "🔄 Re-interview" },
  { value: "REJECTED", label: "❌ Rejected" },
] as const;

export function RecruiterDashboard({
  room,
  currentToken,
  waitingCount,
  todayDone,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [decision, setDecision] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const callNext = () =>
    start(async () => {
      setError(null);
      const r = await callNextToken(room.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Called token #${r.data?.tokenNumber}`);
      router.refresh();
    });

  const markStarted = (tokenId: string) =>
    start(async () => {
      const r = await markInProgress(tokenId);
      if (!r.ok) toast.error(r.error);
      else router.refresh();
    });

  const skip = (tokenId: string) =>
    start(async () => {
      const r = await skipToken(tokenId, room.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Token skipped — can be recalled later");
        router.refresh();
      }
    });

  const submit = () => {
    if (!currentToken) return;
    if (!decision) {
      setError("Choose a decision");
      return;
    }
    if (!rating) {
      setError("Give a rating (1–5)");
      return;
    }
    setError(null);
    start(async () => {
      // studentId intentionally omitted — derived server-side from token
      // to prevent cross-student mutation (see recruiter/actions.ts C4).
      const r = await submitInterviewDecision({
        tokenId: currentToken.id,
        roomId: room.id,
        decision,
        rating,
        notes,
        autoAdvance,
      });
      if (!r.ok) {
        setError(r.error);
        toast.error(r.error);
        return;
      }
      toast.success(
        r.nextTokenNumber
          ? `Decision saved · Called token #${r.nextTokenNumber}`
          : "Decision saved"
      );
      // Reset form
      setDecision("");
      setRating(0);
      setNotes("");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Top stats bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Stat label="In queue" value={waitingCount} accent="text-amber-600" />
        <Stat label="Done today" value={todayDone} accent="text-brand-green" />
        <div className="ml-auto">
          {!currentToken && (
            <Button onClick={callNext} disabled={pending || waitingCount === 0}>
              {pending
                ? "Calling…"
                : waitingCount === 0
                  ? "Queue empty"
                  : "Call next token →"}
            </Button>
          )}
        </div>
      </div>

      {!currentToken ? (
        <EmptyState waitingCount={waitingCount} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT — candidate detail */}
          <section className="rounded-xl border border-brand-border bg-brand-surface">
            <header className="flex items-center justify-between gap-4 border-b border-brand-border p-6">
              <div className="flex items-center gap-4">
                {currentToken.docs.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentToken.docs.photo}
                    alt={currentToken.student.fullName}
                    className="h-16 w-16 rounded-lg object-cover border border-brand-border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-brand-bg border border-brand-border" />
                )}
                <div className="flex items-center gap-5">
                  <div className="rounded-xl bg-brand-green/10 border border-brand-green/30 px-5 py-3 text-center min-w-[7rem]">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-green-dark">
                      Token
                    </p>
                    <p className="text-5xl font-extrabold text-brand-green tabular-nums leading-none tracking-tight">
                      #{currentToken.tokenNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                      Now interviewing
                    </p>
                    <h1 className="text-2xl font-bold text-brand-text">
                      {currentToken.student.fullName}
                    </h1>
                    <p className="text-sm font-mono text-brand-muted">
                      {currentToken.student.registrationId}
                    </p>
                  </div>
                </div>
              </div>
              {currentToken.status === "CALLED" && (
                <Button
                  variant="navy"
                  size="sm"
                  onClick={() => markStarted(currentToken.id)}
                  disabled={pending}
                >
                  Mark as started
                </Button>
              )}
              {currentToken.status === "IN_PROGRESS" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
                  Interview in progress
                </span>
              )}
            </header>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-6 text-sm sm:grid-cols-3">
              <Detail label="Course" value={`${currentToken.student.course} · ${currentToken.student.semester}`} />
              <Detail label="10th %" value={currentToken.student.tenthPercent} />
              <Detail label="12th %" value={currentToken.student.twelfthPercent} />
              <Detail label="Graduation CGPA" value={currentToken.student.graduationCgpa ?? "—"} />
              <Detail label="Specialization" value={currentToken.student.specialization ?? "—"} />
              <Detail label="Gender" value={currentToken.student.gender.replace("_", " ")} />
              <Detail label="Phone" value={currentToken.student.phone} />
              <Detail label="Email" value={currentToken.student.email} />
              <Detail label="Father's name" value={currentToken.student.fatherName ?? "—"} />
              <Detail label="Mother's name" value={currentToken.student.motherName ?? "—"} />
              <Detail
                label="10th board state"
                value={currentToken.student.tenthState ?? "—"}
              />
              <Detail
                label="12th board state"
                value={currentToken.student.twelfthState ?? "—"}
              />
              <div className="col-span-2 sm:col-span-3">
                <Detail label="Address" value={currentToken.student.address ?? "—"} />
              </div>
            </dl>

            {currentToken.docs.resume && (
              <div className="border-t border-brand-border p-6">
                <a
                  href={currentToken.docs.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-blue hover:underline"
                >
                  📄 Open resume in new tab →
                </a>
              </div>
            )}
          </section>

          {/* RIGHT — decision form */}
          <section className="rounded-xl border border-brand-border bg-brand-surface">
            <header className="border-b border-brand-border p-6">
              <h2 className="text-base font-semibold text-brand-text">
                Record decision
              </h2>
              <p className="mt-1 text-xs text-brand-muted">
                Decision triggers a candidate email (next builds).
              </p>
            </header>
            <div className="space-y-5 p-6">
              <FormField>
                <Label required>Decision</Label>
                <Select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {DECISIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField>
                <Label required>Rating</Label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      className={`h-10 w-10 rounded-md border text-lg transition ${
                        rating >= n
                          ? "border-brand-green bg-brand-green text-white"
                          : "border-brand-border bg-white text-brand-muted hover:bg-brand-bg"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Communication: strong. Aviation domain knowledge: needs work. Recommended for ground staff…"
                />
              </FormField>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="h-4 w-4 rounded border-brand-border accent-brand-green"
                />
                Call next token automatically after submit
              </label>

              <FieldError message={error ?? undefined} />

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => skip(currentToken.id)}
                  disabled={pending}
                >
                  Skip (no-show)
                </Button>
                <Button
                  type="button"
                  className="flex-[2]"
                  onClick={submit}
                  disabled={pending}
                >
                  {pending ? "Saving…" : "Submit decision"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function EmptyState({ waitingCount }: { waitingCount: number }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface p-12 text-center">
      <p className="text-5xl">{waitingCount === 0 ? "🎉" : "👋"}</p>
      <p className="mt-4 text-lg font-semibold text-brand-text">
        {waitingCount === 0
          ? "Queue is empty"
          : `${waitingCount} student${waitingCount === 1 ? "" : "s"} waiting`}
      </p>
      <p className="mt-1 text-sm text-brand-muted">
        {waitingCount === 0
          ? "Take a break — or wait for new registrations."
          : 'Click "Call next token" when you\'re ready for the next candidate.'}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface px-4 py-2">
      <p className="text-[10px] uppercase tracking-widest text-brand-muted">
        {label}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-brand-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-brand-text break-words">{value}</dd>
    </div>
  );
}

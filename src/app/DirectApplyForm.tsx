"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { submitDirectApplyAction } from "@/lib/direct-apply/actions";
import { DIRECT_APPLY_ROLES as ROLES } from "@/lib/direct-apply/roles";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { FormField, Label, FieldError, FieldHint } from "@/components/ui/Form";

// Mirrors the server-side cap in lib/direct-apply/actions.ts. Checked here too
// so an oversized file fails instantly instead of after a 5 MB upload.
const MAX_CV_BYTES = 5 * 1024 * 1024;

export function DirectApplyForm({
  variant = "apply",
  sourceDetail,
}: { variant?: "apply" | "network"; sourceDetail?: string } = {}) {
  const isNetwork = variant === "network";
  const [state, formAction, pending] = useActionState(
    submitDirectApplyAction,
    null
  );
  const [consent, setConsent] = useState(false);
  const [cvName, setCvName] = useState<string | null>(null);

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-brand-green/40 bg-brand-green/5 p-8 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-white text-2xl">
          ✓
        </div>
        <h3 className="mt-4 text-xl font-bold text-brand-green-dark">
          {isNetwork ? "You're in our talent network" : "Application received"}
        </h3>
        <p className="mt-2 text-sm text-brand-text">{state.message}</p>
        <p className="mt-4 text-xs text-brand-muted">
          For urgent enquiries, write to{" "}
          <a href="mailto:aviation@ews.aero" className="text-brand-blue hover:underline">
            aviation@ews.aero
          </a>
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-4 shadow-sm"
    >
      {/* Attributes the sign-up to its spoke; the ingest validates + defaults it. */}
      <input type="hidden" name="source" value={isNetwork ? "TALENT_NETWORK" : "CAREERS_FORM"} />
      <input type="hidden" name="sourceDetail" value={sourceDetail ?? (isNetwork ? "careers.ews.aero talent network" : "careers.ews.aero direct-apply")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField>
          <Label required>Full name</Label>
          <Input name="fullName" placeholder="As on your ID" required maxLength={120} />
        </FormField>
        <FormField>
          <Label required>Email</Label>
          <Input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            maxLength={120}
            autoComplete="email"
          />
        </FormField>
        <FormField>
          <Label required>Mobile number</Label>
          <Input
            name="phone"
            type="tel"
            placeholder="10-digit Indian number"
            required
            maxLength={10}
            pattern="[6-9][0-9]{9}"
            inputMode="numeric"
            autoComplete="tel"
          />
        </FormField>
        <FormField>
          <Label required>Role you&apos;re interested in</Label>
          <Select name="roleInterest" required defaultValue="">
            <option value="" disabled>
              Select a role…
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField>
        <Label>Years of relevant experience (optional)</Label>
        <Input
          name="experienceYears"
          type="number"
          min={0}
          max={50}
          placeholder="0 if fresher"
          inputMode="numeric"
        />
        <FieldHint>
          Leave blank if you&apos;re a recent graduate / student.
        </FieldHint>
      </FormField>

      <FormField>
        <Label>Upload your CV (optional)</Label>
        <input
          type="file"
          name="cv"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return setCvName(null);
            if (f.size > MAX_CV_BYTES) {
              toast.error("That CV is over 5 MB. Please upload a smaller file.");
              e.target.value = "";
              return setCvName(null);
            }
            setCvName(f.name);
          }}
          className="block w-full cursor-pointer rounded-lg border border-brand-border bg-white text-sm text-brand-text file:mr-3 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-brand-navy file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-blue"
        />
        <FieldHint>
          PDF or Word, up to 5 MB.{" "}
          {cvName
            ? `Attached: ${cvName}`
            : "No CV handy? Submit anyway — we'll ask for it when we call."}
        </FieldHint>
      </FormField>

      <FormField>
        <Label>Anything else we should know?</Label>
        <Textarea
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Preferred location, language skills, current employer, notice period, etc."
        />
      </FormField>

      <label className="flex items-start gap-3 cursor-pointer text-sm pt-2">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-brand-border text-brand-green focus:ring-brand-green"
          required
        />
        <span className="text-brand-text">
          I consent to Elite World Services Limited storing and processing my details
          and CV, and sharing them with its airport partner operators, for the
          purpose of evaluating my application, in accordance with the Digital
          Personal Data Protection Act, 2023.
        </span>
      </label>

      {state?.ok === false && (
        <FieldError message={state.error} />
      )}

      <Button
        type="submit"
        variant="navy"
        className="w-full"
        disabled={!consent || pending}
        onClick={() => {
          if (consent) toast.info(isNetwork ? "Joining the talent network…" : "Submitting your application…");
        }}
      >
        {pending ? (isNetwork ? "Joining…" : "Submitting…") : isNetwork ? "Join the talent network →" : "Submit application →"}
      </Button>

      <p className="text-center text-xs text-brand-muted">
        Or write directly to{" "}
        <a href="mailto:aviation@ews.aero" className="text-brand-blue hover:underline">
          aviation@ews.aero
        </a>
      </p>
    </form>
  );
}

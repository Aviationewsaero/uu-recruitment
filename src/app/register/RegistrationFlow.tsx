"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import {
  FormField,
  FormRow,
  FormSection,
  Label,
  FieldError,
  FieldHint,
} from "@/components/ui/Form";
import {
  registrationFormSchema,
  type RegistrationFormValues,
  GENDER_OPTIONS,
  COURSE_OPTIONS,
  SEMESTER_OPTIONS,
} from "@/lib/registration/schema";
import {
  requestOtpAction,
  verifyOtpAction,
  submitRegistrationAction,
} from "@/lib/registration/actions";
import { PhotoField } from "./PhotoField";

type Step = "email" | "otp" | "form";

export function RegistrationFlow() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [hasOtpStep, setHasOtpStep] = useState(true);
  const router = useRouter();

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-6 sm:p-8 shadow-sm">
      <StepIndicator current={step} skipOtp={!hasOtpStep} />
      {step === "email" && (
        <EmailStep
          onProceed={(emailVal, bypassed) => {
            setEmail(emailVal);
            setHasOtpStep(!bypassed);
            setStep(bypassed ? "form" : "otp");
          }}
        />
      )}
      {step === "otp" && (
        <OtpStep
          email={email}
          onVerified={() => setStep("form")}
          onBack={() => setStep("email")}
        />
      )}
      {step === "form" && (
        <RegistrationForm
          email={email}
          onSubmitted={(regId, t) =>
            router.push(`/register/success/${regId}?t=${t}`)
          }
        />
      )}
    </div>
  );
}

// ---------- Step indicator ----------
function StepIndicator({ current, skipOtp }: { current: Step; skipOtp: boolean }) {
  const allSteps: { id: Step; label: string }[] = [
    { id: "email", label: "Your email" },
    { id: "otp", label: "Enter code" },
    { id: "form", label: "Your details" },
  ];
  const steps = skipOtp ? allSteps.filter((s) => s.id !== "otp") : allSteps;
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs">
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                done
                  ? "bg-brand-green text-white"
                  : active
                    ? "bg-brand-navy text-white"
                    : "bg-brand-bg text-brand-muted"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={
                active || done
                  ? "text-brand-text font-medium"
                  : "text-brand-muted"
              }
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 h-px w-6 bg-brand-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Email step ----------
function EmailStep({
  onProceed,
}: {
  onProceed: (email: string, bypassed: boolean) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await requestOtpAction(null, fd);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          if (res.bypassed) {
            // No OTP step — straight to the form
            onProceed(res.email, true);
          } else {
            toast.success("Verification code sent — check your inbox");
            onProceed(res.email, false);
          }
        });
      }}
    >
      <FormField>
        <Label htmlFor="email" required>
          Your email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
          disabled={pending}
        />
        <FieldHint>
          We&apos;ll send your token + admit card here. This email cannot be
          changed later.
        </FieldHint>
        <FieldError message={error ?? undefined} />
      </FormField>
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
        {pending ? "Loading…" : "Continue →"}
      </Button>
    </form>
  );
}

// ---------- OTP step (only used if STUDENT_AUTH=otp) ----------
function OtpStep({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        fd.set("email", email);
        start(async () => {
          const res = await verifyOtpAction(null, fd);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          toast.success("Email verified");
          onVerified();
        });
      }}
    >
      <p className="mb-4 text-sm text-brand-muted">
        Code sent to <strong className="text-brand-text">{email}</strong>.{" "}
        <button
          type="button"
          onClick={onBack}
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
          pattern="[0-9]*"
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
        {pending ? "Verifying…" : "Verify code →"}
      </Button>
    </form>
  );
}

// ---------- Full form step ----------
function RegistrationForm({
  email,
  onSubmitted,
}: {
  email: string;
  onSubmitted: (regId: string, admitCardToken: string) => void;
}) {
  const [pending, start] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registrationFormSchema) as any,
  });
  const watchedCourse = watch("course");

  return (
    <form
      onSubmit={handleSubmit((vals) => {
        setSubmitError(null);
        setUploading(true);
        start(async () => {
          try {
            const fd = new FormData();
            for (const [k, v] of Object.entries(vals)) {
              if (v === undefined || v === null) continue;
              fd.set(k, v as string | Blob);
            }
            // PhotoField now owns compression + has already written the
            // compressed File into the hidden <input name="photo">. We
            // just read both files out of the DOM and put them on the
            // FormData payload.
            const fileForm =
              document.querySelector<HTMLFormElement>("#file-fields");
            if (fileForm) {
              const resume = (
                fileForm.querySelector(
                  '[name="resume"]'
                ) as HTMLInputElement | null
              )?.files?.[0];
              const photo = (
                fileForm.querySelector(
                  '[name="photo"]'
                ) as HTMLInputElement | null
              )?.files?.[0];
              if (!photo) {
                setSubmitError(
                  "Please pick or take a passport-size photo before submitting."
                );
                toast.error("Photo is required");
                setUploading(false);
                return;
              }
              if (resume) fd.set("resume", resume);
              fd.set("photo", photo);
            }
            const res = await submitRegistrationAction(email, fd);
            if (!res.ok) {
              setSubmitError(res.error);
              toast.error("Could not submit — see error below");
              return;
            }
            toast.success(`Registered! Token #${res.tokenNumber}`);
            onSubmitted(res.registrationId, res.admitCardToken);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            setSubmitError(`Submit failed: ${msg}`);
            toast.error("Submission failed — try again or use a smaller photo");
          } finally {
            setUploading(false);
          }
        });
      })}
      className="space-y-8"
    >
      <p className="rounded-md bg-brand-bg border border-brand-border px-3 py-2 text-sm">
        Registering as: <strong>{email}</strong>{" "}
        <span className="text-brand-muted">(email locked)</span>
      </p>

      <FormSection title="About you">
        <FormRow cols={2}>
          <FormField>
            <Label required>Full name</Label>
            <Input
              {...register("fullName")}
              placeholder="As per ID"
              autoComplete="name"
            />
            <FieldError message={errors.fullName?.message} />
          </FormField>
          <FormField>
            <Label required>Phone</Label>
            <Input
              {...register("phone")}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="10-digit mobile"
              maxLength={10}
              autoComplete="tel"
            />
            <FieldError message={errors.phone?.message} />
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField>
            <Label required>Gender</Label>
            <Select {...register("gender")} defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.gender?.message} />
          </FormField>
        </FormRow>
        <details className="rounded-md border border-brand-border p-3 text-sm">
          <summary className="cursor-pointer text-brand-muted font-medium">
            Add parent names + address (optional — on your resume anyway)
          </summary>
          <div className="mt-3 space-y-3">
            <FormRow cols={2}>
              <FormField>
                <Label>Father&apos;s name</Label>
                <Input {...register("fatherName")} />
              </FormField>
              <FormField>
                <Label>Mother&apos;s name</Label>
                <Input {...register("motherName")} />
              </FormField>
            </FormRow>
            <FormField>
              <Label>Address</Label>
              <Textarea
                {...register("address")}
                rows={2}
                placeholder="Permanent address"
              />
            </FormField>
          </div>
        </details>
      </FormSection>

      <FormSection title="Academics">
        <FormRow cols={2}>
          <FormField>
            <Label required>Course</Label>
            <Select {...register("course")} defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              {COURSE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <FieldError message={errors.course?.message} />
          </FormField>
          <FormField>
            <Label required>Semester</Label>
            <Select {...register("semester")} defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <FieldError message={errors.semester?.message} />
          </FormField>
        </FormRow>
        {watchedCourse === "Other (specify)" && (
          <FormField>
            <Label required>Specify course name</Label>
            <Input {...register("customCourse")} />
          </FormField>
        )}
        <FormRow cols={2}>
          <FormField>
            <Label required>10th %</Label>
            <Input
              {...register("tenthPercent")}
              type="number"
              step="0.01"
              min={0}
              max={100}
              inputMode="decimal"
              placeholder="82.5"
            />
            <FieldError message={errors.tenthPercent?.message} />
          </FormField>
          <FormField>
            <Label required>12th %</Label>
            <Input
              {...register("twelfthPercent")}
              type="number"
              step="0.01"
              min={0}
              max={100}
              inputMode="decimal"
              placeholder="76.4"
            />
            <FieldError message={errors.twelfthPercent?.message} />
          </FormField>
        </FormRow>
        <details className="rounded-md border border-brand-border p-3 text-sm">
          <summary className="cursor-pointer text-brand-muted font-medium">
            Add specialization, CGPA, board state (optional)
          </summary>
          <div className="mt-3 space-y-3">
            <FormField>
              <Label>Specialization</Label>
              <Input {...register("specialization")} />
            </FormField>
            <FormRow cols={2}>
              <FormField>
                <Label>Graduation CGPA</Label>
                <Input
                  {...register("graduationCgpa")}
                  type="number"
                  step="0.01"
                  min={0}
                  max={10}
                  placeholder="7.8"
                />
              </FormField>
              <FormField>
                <Label>10th board state</Label>
                <Input
                  {...register("tenthState")}
                  placeholder="Uttarakhand"
                />
              </FormField>
            </FormRow>
            <FormField>
              <Label>12th board state</Label>
              <Input
                {...register("twelfthState")}
                placeholder="Uttarakhand"
              />
            </FormField>
          </div>
        </details>
      </FormSection>

      <FormSection title="Upload documents">
        <div id="file-fields" className="space-y-4">
          <FormField>
            <Label required>Resume (PDF or DOCX, max 5MB)</Label>
            <Input
              name="resume"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              className="file:mr-3 file:rounded file:border-0 file:bg-brand-bg file:px-3 file:py-1 file:text-sm file:font-medium"
            />
          </FormField>
          <FormField>
            <Label required>Passport-size photo</Label>
            <PhotoField />
            <FieldHint>
              Upload from gallery OR take a new photo. We resize and
              compress automatically to ~150 KB before upload, so even
              big iPhone HEIC photos work.
            </FieldHint>
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Consent">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register("consentGiven")}
            className="mt-1 h-4 w-4 rounded border-brand-border accent-brand-green"
          />
          <span className="text-sm text-brand-text">
            I consent to Elite World Services collecting and processing my
            data for this recruitment drive. Data is held for 18 months and I
            can email aviation@ews.aero to request deletion anytime.
          </span>
        </label>
        <FieldError message={errors.consentGiven?.message} />
      </FormSection>

      {submitError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {uploading
          ? "Uploading + generating your token…"
          : pending
            ? "Submitting…"
            : "Submit registration"}
      </Button>
      {pending && (
        <p className="text-center text-xs text-brand-muted">
          Hang on — this can take 10–15 seconds on slow connections. Don&apos;t
          close this tab.
        </p>
      )}
    </form>
  );
}

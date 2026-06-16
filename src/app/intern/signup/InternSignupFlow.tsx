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
} from "@/components/ui/Form";
import {
  emailVerificationSchema,
  otpVerificationSchema,
  passwordSchema,
  personalDetailsSchema,
  universityDetailsSchema,
  emergencyDetailsSchema,
  internSignupFormSchema,
  GENDER_OPTIONS,
  DEPARTMENT_OPTIONS,
  type InternSignupFormValues,
} from "@/lib/intern/schema";
import {
  requestInternOtpAction,
  verifyInternOtpAction,
  submitInternSignupAction,
} from "@/lib/intern/actions";

type Step = "email" | "otp" | "password" | "personal" | "university" | "emergency" | "confirm";

export function InternSignupFlow() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState<Partial<InternSignupFormValues>>({});
  const router = useRouter();

  const handleEmailVerified = (emailVal: string) => {
    setEmail(emailVal);
    setStep("otp");
  };

  const handleOtpVerified = () => {
    setStep("password");
  };

  const handlePasswordNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep("personal");
  };

  const handlePersonalDetailsNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep("university");
  };

  const handleUniversityDetailsNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep("emergency");
  };

  const handleEmergencyDetailsNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep("confirm");
  };

  const handleSignupComplete = (internId: string) => {
    router.push(`/intern/signup/success/${internId}`);
  };

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-6 sm:p-8 shadow-sm">
      <StepIndicator current={step} />
      {step === "email" && <EmailStep onProceed={handleEmailVerified} />}
      {step === "otp" && (
        <OtpStep
          email={email}
          onVerified={handleOtpVerified}
          onBack={() => setStep("email")}
        />
      )}
      {step === "password" && (
        <PasswordStep
          onNext={handlePasswordNext}
          onBack={() => setStep("otp")}
        />
      )}
      {step === "personal" && (
        <PersonalDetailsStep
          onNext={handlePersonalDetailsNext}
          onBack={() => setStep("password")}
        />
      )}
      {step === "university" && (
        <UniversityDetailsStep
          onNext={handleUniversityDetailsNext}
          onBack={() => setStep("personal")}
        />
      )}
      {step === "emergency" && (
        <EmergencyDetailsStep
          onNext={handleEmergencyDetailsNext}
          onBack={() => setStep("university")}
        />
      )}
      {step === "confirm" && (
        <ConfirmStep
          email={email}
          formData={formData as InternSignupFormValues}
          onSubmit={handleSignupComplete}
          onBack={() => setStep("emergency")}
        />
      )}
    </div>
  );
}

// ──────────── Step Indicator ────────────

function StepIndicator({ current }: { current: Step }) {
  const allSteps: { id: Step; label: string }[] = [
    { id: "email", label: "Email" },
    { id: "otp", label: "Verify" },
    { id: "password", label: "Password" },
    { id: "personal", label: "Personal" },
    { id: "university", label: "University" },
    { id: "emergency", label: "Emergency" },
    { id: "confirm", label: "Confirm" },
  ];

  const idx = allSteps.findIndex((s) => s.id === current);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2">
        {allSteps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2 flex-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                i <= idx
                  ? "bg-brand-success text-brand-surface"
                  : "bg-brand-muted text-brand-text opacity-50"
              }`}
            >
              {i + 1}
            </div>
            {i < allSteps.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${
                  i < idx ? "bg-brand-success" : "bg-brand-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs uppercase tracking-widest text-brand-muted">
        Step {idx + 1} of {allSteps.length}
      </p>
    </div>
  );
}

// ──────────── Email Step ────────────

function EmailStep({ onProceed }: { onProceed: (email: string) => void }) {
  const form = useForm({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { email: "" },
  });
  const [isPending, startTransition] = useTransition();

  const onSubmit = async (data: any) => {
    startTransition(async () => {
      const result = await requestInternOtpAction(data.email);
      if (result.success) {
        toast.success("OTP sent to your email");
        onProceed(data.email);
      } else {
        toast.error(result.error || "Failed to send OTP");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Email Address">
        <FormField>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@university.edu"
            {...form.register("email")}
            disabled={isPending}
          />
          {form.formState.errors.email && (
            <FieldError message={form.formState.errors.email.message} />
          )}
        </FormField>
      </FormSection>
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending..." : "Send Verification Code"}
        </Button>
      </div>
    </form>
  );
}

// ──────────── OTP Step ────────────

function OtpStep({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: { otp: "" },
  });
  const [isPending, startTransition] = useTransition();

  const onSubmit = async (data: any) => {
    startTransition(async () => {
      const result = await verifyInternOtpAction(email, data.otp);
      if (result.success) {
        toast.success("Email verified");
        onVerified();
      } else {
        toast.error(result.error || "Failed to verify OTP");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Verification Code">
        <p className="mb-4 text-sm text-brand-muted">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>
        <FormField>
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="000000"
            maxLength={6}
            {...form.register("otp")}
            disabled={isPending}
          />
          {form.formState.errors.otp && (
            <FieldError message={form.formState.errors.otp.message} />
          )}
        </FormField>
      </FormSection>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
        >
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Verifying..." : "Verify Code"}
        </Button>
      </div>
    </form>
  );
}

// ──────────── Password Step ────────────

function PasswordStep({
  onNext,
  onBack,
}: {
  onNext: (data: any) => void;
  onBack: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (data: any) => {
    startTransition(async () => {
      onNext(data);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Create Password">
        <p className="mb-4 text-sm text-brand-muted">
          Choose a password for your internship portal account.
        </p>
        <FormField>
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min 8 characters"
            {...form.register("password")}
            disabled={isPending}
          />
          {form.formState.errors.password && (
            <FieldError message={form.formState.errors.password.message} />
          )}
        </FormField>
        <FormField>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            {...form.register("confirmPassword")}
            disabled={isPending}
          />
          {form.formState.errors.confirmPassword && (
            <FieldError message={form.formState.errors.confirmPassword.message} />
          )}
        </FormField>
      </FormSection>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          Continue
        </Button>
      </div>
    </form>
  );
}

// ──────────── Personal Details Step ────────────

function PersonalDetailsStep({
  onNext,
  onBack,
}: {
  onNext: (data: any) => void;
  onBack: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(personalDetailsSchema),
  });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (data: any) => {
    startTransition(async () => {
      onNext(data);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Personal Information">
        <FormRow>
          <FormField>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Your full name"
              {...form.register("fullName")}
              disabled={isPending}
            />
            {form.formState.errors.fullName && (
              <FieldError message={form.formState.errors.fullName.message} />
            )}
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...form.register("dateOfBirth")}
              disabled={isPending}
            />
          </FormField>
          <FormField>
            <Label htmlFor="gender">Gender *</Label>
            <Select {...form.register("gender")} disabled={isPending}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {form.formState.errors.gender && (
              <FieldError message={form.formState.errors.gender.message} />
            )}
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Input
              id="bloodGroup"
              type="text"
              placeholder="e.g., O+"
              {...form.register("bloodGroup")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
      </FormSection>

      <FormSection title="Contact Information">
        <FormRow>
          <FormField>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="10-digit number"
              {...form.register("phone")}
              disabled={isPending}
            />
            {form.formState.errors.phone && (
              <FieldError message={form.formState.errors.phone.message} />
            )}
          </FormField>
          <FormField>
            <Label htmlFor="alternatePhone">Alternate Phone</Label>
            <Input
              id="alternatePhone"
              type="tel"
              placeholder="10-digit number"
              {...form.register("alternatePhone")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="parentContact">Parent/Guardian Contact</Label>
            <Input
              id="parentContact"
              type="tel"
              placeholder="10-digit number"
              {...form.register("parentContact")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="currentAddress">Current Address</Label>
            <Textarea
              id="currentAddress"
              placeholder="Street, City, State"
              {...form.register("currentAddress")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="permanentAddress">Permanent Address</Label>
            <Textarea
              id="permanentAddress"
              placeholder="Street, City, State"
              {...form.register("permanentAddress")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
      </FormSection>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
        >
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          Continue
        </Button>
      </div>
    </form>
  );
}

// ──────────── University Details Step ────────────

function UniversityDetailsStep({
  onNext,
  onBack,
}: {
  onNext: (data: any) => void;
  onBack: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(universityDetailsSchema),
  });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (data: any) => {
    startTransition(async () => {
      onNext(data);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="University Information">
        <FormRow>
          <FormField>
            <Label htmlFor="department">Department *</Label>
            <Select {...form.register("department")} disabled={isPending}>
              <option value="">Select department</option>
              {DEPARTMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {form.formState.errors.department && (
              <FieldError message={form.formState.errors.department.message} />
            )}
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
            <Input
              id="enrollmentNumber"
              type="text"
              placeholder="Your enrollment number"
              {...form.register("enrollmentNumber")}
              disabled={isPending}
            />
          </FormField>
          <FormField>
            <Label htmlFor="batchYear">Batch Year</Label>
            <Input
              id="batchYear"
              type="number"
              placeholder="e.g., 2025"
              {...form.register("batchYear", { valueAsNumber: true })}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="currentSemester">Current Semester</Label>
            <Input
              id="currentSemester"
              type="text"
              placeholder="e.g., 5th"
              {...form.register("currentSemester")}
              disabled={isPending}
            />
          </FormField>
          <FormField>
            <Label htmlFor="expectedGraduation">Expected Graduation</Label>
            <Input
              id="expectedGraduation"
              type="text"
              placeholder="e.g., June 2026"
              {...form.register("expectedGraduation")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="universityMentor">University Mentor Name</Label>
            <Input
              id="universityMentor"
              type="text"
              placeholder="Your faculty mentor's name"
              {...form.register("universityMentor")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
      </FormSection>

      <FormSection title="Education History">
        <FormRow>
          <FormField>
            <Label htmlFor="class10Board">Class 10 Board</Label>
            <Input
              id="class10Board"
              type="text"
              placeholder="CBSE, ICSE, State Board, etc."
              {...form.register("class10Board")}
              disabled={isPending}
            />
          </FormField>
          <FormField>
            <Label htmlFor="class10Year">Class 10 Year</Label>
            <Input
              id="class10Year"
              type="number"
              placeholder="e.g., 2020"
              {...form.register("class10Year", { valueAsNumber: true })}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="class10Percent">Class 10 Percentage</Label>
            <Input
              id="class10Percent"
              type="number"
              step="0.01"
              placeholder="e.g., 92.5"
              {...form.register("class10Percent", { valueAsNumber: true })}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="class12Board">Class 12 Board</Label>
            <Input
              id="class12Board"
              type="text"
              placeholder="CBSE, ICSE, State Board, etc."
              {...form.register("class12Board")}
              disabled={isPending}
            />
          </FormField>
          <FormField>
            <Label htmlFor="class12Stream">Class 12 Stream</Label>
            <Input
              id="class12Stream"
              type="text"
              placeholder="Science, Commerce, Arts"
              {...form.register("class12Stream")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="class12Year">Class 12 Year</Label>
            <Input
              id="class12Year"
              type="number"
              placeholder="e.g., 2022"
              {...form.register("class12Year", { valueAsNumber: true })}
              disabled={isPending}
            />
          </FormField>
          <FormField>
            <Label htmlFor="class12Percent">Class 12 Percentage</Label>
            <Input
              id="class12Percent"
              type="number"
              step="0.01"
              placeholder="e.g., 88.3"
              {...form.register("class12Percent", { valueAsNumber: true })}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="ugCourse">Undergraduate Course</Label>
            <Input
              id="ugCourse"
              type="text"
              placeholder="e.g., B.Tech (Computer Science)"
              {...form.register("ugCourse")}
              disabled={isPending}
            />
          </FormField>
          <FormField>
            <Label htmlFor="currentCgpa">Current CGPA</Label>
            <Input
              id="currentCgpa"
              type="number"
              step="0.01"
              placeholder="e.g., 3.85"
              {...form.register("currentCgpa", { valueAsNumber: true })}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
      </FormSection>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
        >
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          Continue
        </Button>
      </div>
    </form>
  );
}

// ──────────── Emergency Details Step ────────────

function EmergencyDetailsStep({
  onNext,
  onBack,
}: {
  onNext: (data: any) => void;
  onBack: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(emergencyDetailsSchema),
  });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (data: any) => {
    startTransition(async () => {
      onNext(data);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Emergency Contact">
        <FormRow>
          <FormField>
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input
              id="emergencyContactName"
              type="text"
              placeholder="Full name"
              {...form.register("emergencyContactName")}
              disabled={isPending}
            />
          </FormField>
          <FormField>
            <Label htmlFor="emergencyContactRelation">Relation</Label>
            <Input
              id="emergencyContactRelation"
              type="text"
              placeholder="e.g., Parent, Sibling"
              {...form.register("emergencyContactRelation")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField>
            <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              placeholder="10-digit number"
              {...form.register("emergencyContactPhone")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
      </FormSection>

      <FormSection title="Skills & Interests">
        <FormRow>
          <FormField>
            <Label htmlFor="skillsAssessment">Tell us about your skills</Label>
            <Textarea
              id="skillsAssessment"
              placeholder="Technical skills, languages, software proficiency, certifications, etc."
              {...form.register("skillsAssessment")}
              disabled={isPending}
            />
          </FormField>
        </FormRow>
      </FormSection>

      <FormSection title="Confirmation">
        <div className="flex items-start gap-3">
          <input
            id="consentGiven"
            type="checkbox"
            {...form.register("consentGiven")}
            disabled={isPending}
          />
          <label htmlFor="consentGiven" className="text-sm text-brand-muted">
            I confirm that all the information provided is accurate and complete.
            I understand that providing false information may lead to termination
            of the internship.
          </label>
        </div>
        {form.formState.errors.consentGiven && (
          <FieldError message={form.formState.errors.consentGiven.message} />
        )}
      </FormSection>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
        >
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          Review & Confirm
        </Button>
      </div>
    </form>
  );
}

// ──────────── Confirm Step ────────────

function ConfirmStep({
  email,
  formData,
  onSubmit,
  onBack,
}: {
  email: string;
  formData: InternSignupFormValues;
  onSubmit: (internId: string) => void;
  onBack: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    startTransition(async () => {
      const result = await submitInternSignupAction({
        ...formData,
        email,
      });

      if (result.success) {
        toast.success("Signup complete!");
        onSubmit(result.internId!);
      } else {
        toast.error(result.error || "Signup failed");
      }
    });
  };

  return (
    <div>
      <FormSection title="Review Your Details">
        <div className="space-y-4 rounded-lg bg-brand-muted/20 p-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-muted">
              Email
            </p>
            <p className="mt-1 font-medium">{email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-muted">
              Full Name
            </p>
            <p className="mt-1 font-medium">{formData.fullName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-muted">
              Department
            </p>
            <p className="mt-1 font-medium">
              {DEPARTMENT_OPTIONS.find((d) => d.value === formData.department)
                ?.label || formData.department}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-muted">
              Phone
            </p>
            <p className="mt-1 font-medium">{formData.phone}</p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Next Steps">
        <p className="text-sm text-brand-muted">
          Once you complete signup, an admin will review and activate your
          account. You'll receive an email confirmation.
        </p>
      </FormSection>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
        >
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Creating Account..." : "Complete Signup"}
        </Button>
      </div>
    </div>
  );
}

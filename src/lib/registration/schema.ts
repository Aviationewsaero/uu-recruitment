import { z } from "zod";

// Mirrors prisma enums in a form-friendly way
export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const;

export const COURSE_OPTIONS = [
  "BBA Aviation",
  "BBA Airport Management",
  "MBA Aviation",
  "B.Sc Aviation",
  "Diploma in Aviation",
  "Other (specify)",
] as const;

export const SEMESTER_OPTIONS = [
  "Sem 1",
  "Sem 2",
  "Sem 3",
  "Sem 4",
  "Sem 5",
  "Sem 6",
  "Sem 7",
  "Sem 8",
  "Graduated",
] as const;

const phoneRegex = /^[6-9]\d{9}$/;
const percentRange = z.coerce
  .number()
  .min(0, "Cannot be negative")
  .max(100, "Cannot exceed 100");

export const registrationFormSchema = z.object({
  // Identity
  fullName: z.string().trim().min(2, "Required").max(100),
  fatherName: z.string().trim().min(2, "Required").max(100),
  motherName: z.string().trim().min(2, "Required").max(100),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  address: z.string().trim().min(10, "Please share a full address").max(500),
  // Academic
  course: z.string().trim().min(1, "Required"),
  customCourse: z.string().trim().max(100).optional(),
  semester: z.string().trim().min(1, "Required"),
  specialization: z.string().trim().max(100).optional(),
  tenthPercent: percentRange,
  twelfthPercent: percentRange,
  tenthState: z.string().trim().min(2, "Required").max(100),
  twelfthState: z.string().trim().min(2, "Required").max(100),
  graduationCgpa: z.coerce.number().min(0).max(10).optional(),
  // Consent — coerce to true via refine so RHF can have `false` default
  consentGiven: z
    .boolean()
    .refine((v) => v === true, "You must agree before submitting"),
});

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

// OTP step schemas
export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});
export const otpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

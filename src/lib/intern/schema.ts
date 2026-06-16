import { z } from "zod";

// Gender enum matching Prisma schema
export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const;

// Department enum matching Prisma schema
export const DEPARTMENT_OPTIONS = [
  { value: "DIGITAL_MARKETING", label: "Digital Marketing" },
  { value: "MBA_HR", label: "MBA HR" },
  { value: "OTHER", label: "Other" },
] as const;

// Step 1: Email verification
export const emailVerificationSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
});
export type EmailVerificationValues = z.infer<typeof emailVerificationSchema>;

// Step 2: OTP verification
export const otpVerificationSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
});
export type OtpVerificationValues = z.infer<typeof otpVerificationSchema>;

// Step 3: Personal details
export const personalDetailsSchema = z.object({
  fullName: z.string().min(2, "Name too short").max(255),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  bloodGroup: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  alternatePhone: z.string().regex(/^\d{10}$/).optional().or(z.literal("")),
  currentAddress: z.string().max(500).optional(),
  permanentAddress: z.string().max(500).optional(),
  parentContact: z.string().regex(/^\d{10}$/).optional().or(z.literal("")),
});
export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>;

// Step 4: University & Education
export const universityDetailsSchema = z.object({
  department: z.enum(["DIGITAL_MARKETING", "MBA_HR", "OTHER"]),
  enrollmentNumber: z.string().max(100).optional(),
  batchYear: z.number().optional(),
  currentSemester: z.string().max(100).optional(),
  expectedGraduation: z.string().optional(),
  universityMentor: z.string().max(255).optional(),
  // Education history
  class10Board: z.string().max(100).optional(),
  class10Year: z.number().optional(),
  class10Percent: z.number().optional(),
  class12Board: z.string().max(100).optional(),
  class12Stream: z.string().max(100).optional(),
  class12Year: z.number().optional(),
  class12Percent: z.number().optional(),
  ugCourse: z.string().max(255).optional(),
  currentCgpa: z.number().optional(),
});
export type UniversityDetailsValues = z.infer<typeof universityDetailsSchema>;

// Step 5: Emergency contact & Skills
export const emergencyDetailsSchema = z.object({
  emergencyContactName: z.string().max(255).optional(),
  emergencyContactRelation: z.string().max(100).optional(),
  emergencyContactPhone: z.string().regex(/^\d{10}$/).optional().or(z.literal("")),
  skillsAssessment: z.string().max(2000).optional(),
  consentGiven: z.boolean().refine((v) => v, "You must accept the terms"),
});
export type EmergencyDetailsValues = z.infer<typeof emergencyDetailsSchema>;

// Combined form for validation
export const internSignupFormSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  fullName: z.string().min(2).max(255),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  bloodGroup: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/),
  alternatePhone: z.string().regex(/^\d{10}$/).optional().or(z.literal("")),
  currentAddress: z.string().max(500).optional(),
  permanentAddress: z.string().max(500).optional(),
  parentContact: z.string().regex(/^\d{10}$/).optional().or(z.literal("")),
  department: z.enum(["DIGITAL_MARKETING", "MBA_HR", "OTHER"]),
  enrollmentNumber: z.string().max(100).optional(),
  batchYear: z.number().optional(),
  currentSemester: z.string().max(100).optional(),
  expectedGraduation: z.string().optional(),
  universityMentor: z.string().max(255).optional(),
  class10Board: z.string().max(100).optional(),
  class10Year: z.number().optional(),
  class10Percent: z.number().optional(),
  class12Board: z.string().max(100).optional(),
  class12Stream: z.string().max(100).optional(),
  class12Year: z.number().optional(),
  class12Percent: z.number().optional(),
  ugCourse: z.string().max(255).optional(),
  currentCgpa: z.number().optional(),
  emergencyContactName: z.string().max(255).optional(),
  emergencyContactRelation: z.string().max(100).optional(),
  emergencyContactPhone: z.string().regex(/^\d{10}$/).optional().or(z.literal("")),
  skillsAssessment: z.string().max(2000).optional(),
  consentGiven: z.boolean().refine((v) => v, "You must accept the terms"),
});
export type InternSignupFormValues = z.infer<typeof internSignupFormSchema>;

// Typed env access. Avoids `process.env.X!` everywhere and fails loud at boot.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  // Mode flags
  AUTH_MODE: optional("APP_AUTH_MODE", "mock") as "mock" | "supabase",
  STORAGE_MODE: optional("APP_STORAGE_MODE", "local") as "local" | "supabase",
  EMAIL_MODE: optional("APP_EMAIL_MODE", "console") as "console" | "resend",
  // Student-facing OTP. "none" = bypass OTP entirely (faster, recommended when
  // SMTP is unreliable). "otp" = require email verification.
  STUDENT_AUTH: optional("APP_STUDENT_AUTH", "none") as "none" | "otp",

  // Public app
  APP_URL: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3001"),
  APP_NAME: optional("NEXT_PUBLIC_APP_NAME", "UU Aviation Recruitment 2026"),

  // Supabase — only required when modes flip to supabase
  SUPABASE_URL: optional("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_KEY: optional("SUPABASE_SERVICE_ROLE_KEY"),

  // Resend
  RESEND_API_KEY: optional("RESEND_API_KEY"),
  EMAIL_FROM: optional(
    "EMAIL_FROM",
    "EWS Aviation Recruitment <aviation@ews.aero>"
  ),
  EMAIL_REPLY_TO: optional("EMAIL_REPLY_TO", "aviation@ews.aero"),
} as const;

// Assert critical envs at app boot when in prod mode
export function assertProductionEnv() {
  if (env.AUTH_MODE === "supabase") {
    required("NEXT_PUBLIC_SUPABASE_URL");
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    required("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (env.EMAIL_MODE === "resend") required("RESEND_API_KEY");
}

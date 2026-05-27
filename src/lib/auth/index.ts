// Auth abstraction — same contract for mock and supabase modes.
// Mock: emails OTP to console, validates against in-memory store.
// Supabase: delegates to supabase.auth.signInWithOtp().

import { env } from "@/lib/env";
import * as mock from "./mock";
import * as supabase from "./supabase";

const provider = env.AUTH_MODE === "supabase" ? supabase : mock;

export type SendOtpResult = { ok: true } | { ok: false; error: string };
export type VerifyOtpResult =
  | { ok: true; verifiedEmail: string }
  | { ok: false; error: string };

export const sendOtp = (email: string): Promise<SendOtpResult> =>
  provider.sendOtp(email);

export const verifyOtp = (
  email: string,
  code: string
): Promise<VerifyOtpResult> => provider.verifyOtp(email, code);

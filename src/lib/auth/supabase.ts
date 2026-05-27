// Supabase Auth provider — for production.
// Uses signInWithOtp + verifyOtp via the admin client (server-side only).

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function sendOtp(email: string) {
  const normalized = email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function verifyOtp(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalized,
    token: code.trim(),
    type: "email",
  });
  if (error || !data.user) {
    return { ok: false as const, error: error?.message ?? "Invalid code" };
  }
  return { ok: true as const, verifiedEmail: normalized };
}

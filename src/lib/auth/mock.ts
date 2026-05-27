// Mock OTP provider — for local dev only.
// Stores codes in a module-level Map (singleton across HMR via globalThis).

type OtpEntry = { code: string; expiresAt: number; attempts: number };

const globalForOtp = globalThis as unknown as { __otpStore?: Map<string, OtpEntry> };
const store = globalForOtp.__otpStore ?? new Map<string, OtpEntry>();
if (process.env.NODE_ENV !== "production") globalForOtp.__otpStore = store;

const TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return { ok: false as const, error: "Invalid email" };

  const code = generateCode();
  store.set(normalized, {
    code,
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
  });

  // eslint-disable-next-line no-console
  console.log(
    `\n📧 [MOCK OTP] Code for ${normalized}: \x1b[1;32m${code}\x1b[0m  (expires in 10 min)\n`
  );
  return { ok: true as const };
}

export async function verifyOtp(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const entry = store.get(normalized);

  if (!entry) return { ok: false as const, error: "No code requested for this email" };
  if (entry.expiresAt < Date.now()) {
    store.delete(normalized);
    return { ok: false as const, error: "Code expired — please request a new one" };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(normalized);
    return { ok: false as const, error: "Too many attempts — please request a new code" };
  }

  entry.attempts++;
  if (entry.code !== code.trim()) {
    return { ok: false as const, error: "Incorrect code" };
  }

  store.delete(normalized); // single-use
  return { ok: true as const, verifiedEmail: normalized };
}

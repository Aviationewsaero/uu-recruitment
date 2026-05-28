// Password hashing + verification. Pure module — no Next.js, no Prisma.
// Used by login flow and user-creation flow.
import bcrypt from "bcryptjs";

const COST = 10; // ~80ms on a Vercel function — balances brute-force resistance vs UX

/** Hash a plain-text password. Returns bcrypt string (~60 chars). */
export async function hashPassword(plain: string): Promise<string> {
  if (!plain || plain.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return bcrypt.hash(plain, COST);
}

/** Constant-time verify a plain-text password against a stored hash. */
export async function verifyPassword(
  plain: string,
  hash: string | null | undefined
): Promise<boolean> {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/** Light strength check for new passwords. Returns null if ok, error message otherwise. */
export function validatePasswordStrength(plain: string): string | null {
  if (plain.length < 8) return "Password must be at least 8 characters";
  if (plain.length > 128) return "Password is too long (max 128 chars)";
  if (!/[a-zA-Z]/.test(plain)) return "Password must contain at least one letter";
  if (!/\d/.test(plain)) return "Password must contain at least one digit";
  return null;
}

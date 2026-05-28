import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Singleton in dev to avoid exhausting the connection pool on HMR.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set in environment — Prisma cannot connect"
    );
  }
  // Pool sizing — assumes Supabase Pro (400+ pooled connections).
  //
  // History:
  //   max:1 was right for free tier (60 conns). Vercel could scale to
  //   100+ instances and 1×100 = 100 < 60 broke. So we capped at 1.
  //
  //   Now on Pro: 400+ conns available. Cap at 3 per instance, so
  //   100 instances × 3 = 300 — still under 400 with headroom.
  //   Benefit: a single instance can pipeline a few queries in parallel
  //   (e.g. the admin overview's groupBy + count run truly concurrent).
  const adapter = new PrismaPg({
    connectionString,
    max: 3,
    // Keep idle sockets alive across requests on the same warm Lambda.
    // 5s was too short — every request paid a fresh TLS handshake to
    // Supabase (~150-300ms). 30s lets the socket survive between
    // back-to-back nav/clicks while still releasing during quiet periods.
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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
  // CRITICAL: cap pool to 1 per serverless instance.
  // Supabase free tier gives ~60 concurrent connections. Vercel may scale
  // to 100+ function instances under a registration burst. Without max:1,
  // each instance opens multiple connections and the Supabase pool exhausts
  // within seconds, returning auth errors mid-drive.
  const adapter = new PrismaPg({
    connectionString,
    max: 1,
    idleTimeoutMillis: 5_000,
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

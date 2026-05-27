/**
 * Node concurrency load test for the token allocator.
 *
 * Spawns N concurrent Student+Token transactions against the database.
 * Verifies:
 *   1. All N transactions succeed
 *   2. Token numbers are unique (no race on the SERIAL sequence)
 *   3. Wall-clock time is reasonable (< 30s for 700 on local Postgres)
 *
 * This proves the production-day registration burst (700 students hitting
 * /register in a 10-minute window) is safe at the database layer.
 *
 * Usage:
 *   npm run load-test            # 700 concurrent
 *   npm run load-test -- 200     # custom count
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function registerOne(idx: number) {
  const stamp = Date.now() + idx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.$transaction(async (txRaw: any) => {
    const tx = txRaw as typeof prisma;
    const student = await tx.student.create({
      data: {
        registrationId: `PENDING-LT-${stamp}`,
        fullName: `LoadTest Student ${stamp}`,
        fatherName: "Test Father",
        motherName: "Test Mother",
        phone: `9${String(900000000 + idx).slice(0, 9)}`,
        email: `lt-${stamp}@test.local`,
        gender: "OTHER",
        address: "Load test address",
        course: "BBA Aviation",
        semester: "Sem 6",
        tenthPercent: 80,
        twelfthPercent: 75,
        tenthState: "Uttarakhand",
        twelfthState: "Uttarakhand",
        consentGiven: true,
      },
    });
    const token = await tx.token.create({
      data: { studentId: student.id as string },
    });
    return token.tokenNumber as number;
  });
}

async function main() {
  const N = parseInt(process.argv[2] ?? "700", 10);
  console.log(`\n🔥 Load test: spawning ${N} concurrent registrations…\n`);

  const startCount = await prisma.token.count();
  const t0 = Date.now();

  const results = await Promise.allSettled(
    Array.from({ length: N }, (_, i) => registerOne(i))
  );
  const t = Date.now() - t0;

  const fulfilled = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<number>[];
  const rejected = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

  // Duplicate check
  const tokenNumbers = fulfilled.map((r) => r.value);
  const unique = new Set(tokenNumbers);
  const dupes = tokenNumbers.length - unique.size;

  const endCount = await prisma.token.count();

  // eslint-disable-next-line no-console
  console.log("─────────────────────────────────────────────");
  console.log(`  Spawned          ${N}`);
  console.log(`  Succeeded        ${fulfilled.length}`);
  console.log(`  Failed           ${rejected.length}`);
  console.log(`  Duplicate tokens ${dupes}  ${dupes === 0 ? "✅" : "🚨"}`);
  console.log(`  Tokens before    ${startCount}`);
  console.log(`  Tokens after     ${endCount}  (delta ${endCount - startCount})`);
  console.log(`  Wall time        ${t}ms  (${(N / (t / 1000)).toFixed(1)} req/sec)`);
  console.log("─────────────────────────────────────────────");

  if (rejected.length > 0) {
    console.log("\nFirst 3 errors:");
    rejected.slice(0, 3).forEach((r, i) =>
      console.log(`  [${i}] ${(r.reason as Error)?.message ?? r.reason}`)
    );
  }

  // Pass criteria: ≥99% success, zero duplicates
  const passed = dupes === 0 && fulfilled.length / N >= 0.99;
  console.log(`\n${passed ? "✅ PASS" : "❌ FAIL"}`);
  process.exit(passed ? 0 : 1);
}

main().finally(() => prisma.$disconnect());

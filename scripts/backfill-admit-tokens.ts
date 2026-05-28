// One-shot backfill: fill admitCardToken for any Student rows that still
// have NULL (registrations from before the per-student token was added).
//
// Run once against prod:
//   pnpm tsx scripts/backfill-admit-tokens.ts
//
// After this completes, the conditional `if (student.admitCardToken)` in
// src/app/api/admit-card/[regId]/route.ts can be removed — the token gate
// becomes mandatory for everyone.

import crypto from "node:crypto";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const adapter = new PrismaPg({ connectionString: url, max: 2 });
  const prisma = new PrismaClient({ adapter });

  const missing = await prisma.student.findMany({
    where: { admitCardToken: null },
    select: { id: true, registrationId: true, email: true },
  });

  console.log(`Found ${missing.length} student rows missing admitCardToken`);
  if (missing.length === 0) {
    await prisma.$disconnect();
    return;
  }

  let done = 0;
  for (const s of missing) {
    const token = crypto.randomBytes(16).toString("base64url");
    await prisma.student.update({
      where: { id: s.id },
      data: { admitCardToken: token },
    });
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${missing.length}`);
  }

  console.log(
    `Backfill complete: ${done} rows updated. ` +
      `Existing admit-card URLs in emails are now broken; re-send them via /admin/emails if needed.`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

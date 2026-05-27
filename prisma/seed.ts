// Idempotent seed for local dev + first-time prod setup.
// Run: npm run seed
import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const dbUrl = process.env.DATABASE_URL ?? "";

// Safety guard: refuse to seed if URL looks local but caller explicitly
// asked for prod. Prevents the foot-gun where someone runs `npm run seed`
// expecting prod but hits local Postgres (this exact bug bit us during deploy).
if (process.env.SEED_TARGET === "prod" && /localhost|127\.0\.0\.1/.test(dbUrl)) {
  console.error(
    "❌ Refusing to seed: SEED_TARGET=prod but DATABASE_URL points at localhost."
  );
  console.error("   Export the prod DATABASE_URL in shell before running.");
  process.exit(1);
}

if (!dbUrl) {
  console.error("❌ DATABASE_URL is not set — nothing to seed.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: dbUrl, max: 1 });
const prisma = new PrismaClient({ adapter });

const ROOMS = [
  { roomNumber: "R1", displayName: "Room 1 — Boardroom" },
  { roomNumber: "R2", displayName: "Room 2 — Cabin Crew" },
  { roomNumber: "R3", displayName: "Room 3 — Ground Staff" },
  { roomNumber: "R4", displayName: "Room 4 — Customer Service" },
];

const USERS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@ews.aero",
    fullName: "Super Admin",
    role: "SUPER_ADMIN" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "recruiter1@ews.aero",
    fullName: "Recruiter One",
    role: "RECRUITER" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "recruiter2@ews.aero",
    fullName: "Recruiter Two",
    role: "RECRUITER" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    email: "desk@ews.aero",
    fullName: "Desk Operator",
    role: "DESK_OPERATOR" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    email: "emails@ews.aero",
    fullName: "Email Manager",
    role: "EMAIL_MANAGER" as const,
  },
];

async function main() {
  console.log("🌱 Seeding rooms…");
  for (const r of ROOMS) {
    await prisma.room.upsert({
      where: { roomNumber: r.roomNumber },
      update: { displayName: r.displayName, active: true },
      create: { ...r, active: true },
    });
  }

  console.log("🌱 Seeding users…");
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, role: u.role, active: true },
      create: { ...u, active: true },
    });
  }

  // Assign recruiter1 to R1, recruiter2 to R2 — so dashboard has a default room
  const r1 = USERS[1];
  const r2 = USERS[2];
  await prisma.room.update({
    where: { roomNumber: "R1" },
    data: { recruiterId: r1.id },
  });
  await prisma.room.update({
    where: { roomNumber: "R2" },
    data: { recruiterId: r2.id },
  });

  console.log("✅ Seed complete.");
  console.log("");
  console.log("Login as:");
  USERS.forEach((u) => console.log(`  ${u.role.padEnd(15)}  ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

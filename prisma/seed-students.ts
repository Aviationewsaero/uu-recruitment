// Bulk-seeds N fake students with tokens, for visual testing of display/queue.
// Run: npm run seed:students -- 15
import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const FIRST = [
  "Aarav", "Vihaan", "Aditya", "Vivaan", "Arjun", "Reyansh", "Mohammed", "Sai",
  "Krishna", "Ishaan", "Ananya", "Diya", "Aanya", "Aaradhya", "Priya", "Riya",
  "Pooja", "Neha", "Kavya", "Saanvi",
];
const LAST = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Mehta",
  "Joshi", "Rawat", "Negi", "Bisht", "Pant", "Kothari",
];
const COURSES = ["BBA Aviation", "BBA Airport Management", "B.Sc Aviation", "Diploma in Aviation"];
const SEMS = ["Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"];

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => +(Math.random() * (max - min) + min).toFixed(1);

async function main() {
  const n = parseInt(process.argv[2] ?? "10", 10);
  if (!Number.isFinite(n) || n < 1) {
    console.error("Usage: npm run seed:students -- <N>");
    process.exit(1);
  }
  console.log(`🌱 Creating ${n} fake students…`);

  for (let i = 0; i < n; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const fullName = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}.${Date.now()}-${i}@test.local`;
    const phone = `9${String(Math.floor(100000000 + Math.random() * 899999999)).slice(0, 9)}`;

    const student = await prisma.student.create({
      data: {
        registrationId: `PENDING-${Date.now()}-${i}`,
        fullName,
        fatherName: `${pick(FIRST)} ${last}`,
        motherName: `${pick(FIRST)} ${last}`,
        phone,
        email,
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        address: `${Math.floor(Math.random() * 200)} Test Lane, Dehradun, Uttarakhand`,
        course: pick(COURSES),
        semester: pick(SEMS),
        tenthPercent: rand(60, 95),
        twelfthPercent: rand(55, 92),
        tenthState: "Uttarakhand",
        twelfthState: "Uttarakhand",
        graduationCgpa: rand(6, 9.5),
        consentGiven: true,
      },
    });
    const token = await prisma.token.create({ data: { studentId: student.id } });
    const regId = `UU-AV-2026-${token.tokenNumber.toString().padStart(4, "0")}`;
    await prisma.student.update({
      where: { id: student.id },
      data: { registrationId: regId },
    });
  }
  console.log(`✅ Done. Run \`SELECT COUNT(*) FROM "Token"\` to verify.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

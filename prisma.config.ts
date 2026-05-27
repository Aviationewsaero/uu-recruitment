// Load env from .env.local (Next.js convention) BEFORE .env (Prisma default).
// dotenv won't overwrite already-set vars, so .env.local wins.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv(); // fallback to .env

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
  },
});

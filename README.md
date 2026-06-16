# UU Aviation Recruitment Platform

Production MVP for the Uttaranchal University aviation industry campus drive.
Built by Elite World Services Limited on a 7-day timeline.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres + Auth + Storage + Realtime) · Prisma 7 · Resend · Vercel

**Setup:** See [`SETUP.md`](./SETUP.md) — written for non-developers, ~45 min start to deployed.

## Build sequence

| Day | Deliverable |
|---|---|
| 1 | Scaffold + schema + brand + deploy ← *you are here* |
| 2 | Student registration (OTP, form, upload, admit card) |
| 3 | Token engine + admin auth |
| 4 | Recruiter dashboard |
| 5 | Live queue + TV display (Supabase Realtime) |
| 6 | Admin panel + bulk email + analytics |
| 7 | Load test (700 concurrent) + operator runbook + backups |

## Repo layout

```
prisma/schema.prisma     # 7-table data model
src/app/                 # routes (App Router)
  page.tsx               # public landing
  register/              # student flow  (Day 2)
  admin/                 # admin console (Day 3+6)
  recruiter/             # recruiter UI  (Day 4)
  display/               # TV board     (Day 5)
src/lib/
  prisma.ts              # singleton DB client
  supabase/              # server, client, admin (service-role)
  email.ts               # Resend wrapper
  utils.ts               # cn() helper
```

## Daily commands

```bash
npm run dev              # local
npx prisma studio        # DB GUI
npx prisma migrate dev   # after schema edits
```

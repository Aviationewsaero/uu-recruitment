# Final Deploy Checklist

Single 30-minute session. Follow top-to-bottom. **Don't skip steps.**

Prerequisite: you've finished Days 1–7 locally and everything runs (`npm run dev`).

---

## Phase 1 — Set up cloud accounts (15 min)

### A. Supabase

1. <https://supabase.com/dashboard> → **New project**
2. Name `uu-recruitment-prod` · Region **Mumbai (ap-south-1)** · Pro plan ideally
3. Save the DB password to password manager
4. Wait ~2 min for provision
5. Project Settings → **API**:
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon` key (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **new** `service_role` key (`sb_secret_…`) → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ never share
6. Project Settings → **Database → Connection string**:
   - **Transaction** mode (port 6543) → `DATABASE_URL` — append `?pgbouncer=true&connection_limit=1`
   - **Session** mode (port 5432) → `DIRECT_URL`
   - Replace `[YOUR-PASSWORD]` with the actual password in both
7. **Authentication → Providers → Email**: ✅ Enable, ❌ uncheck "Confirm email"
8. **Authentication → URL Configuration**:
   - Site URL: `https://careers.ews.aero`
   - Redirect URLs: `https://careers.ews.aero/**`, `http://localhost:3001/**`
9. **Storage → New bucket** → name `student-documents` · Private

### B. Resend

1. <https://resend.com/domains> → **Add Domain** → enter `ews.aero`
2. Resend gives 3–4 DNS records (MX, TXT for SPF, TXT for DKIM, optional DMARC)
3. **⚠️ Before adding to DNS**: log into your DNS host (Cloudflare / GoDaddy / Namecheap) → look at existing TXT records starting with `v=spf1`. **If one exists, merge — don't overwrite.**
4. Add Resend's DNS records (~10–30 min propagation)
5. Click **Verify DNS Records** in Resend until all green
6. <https://resend.com/api-keys> → Create key `prod` (full access) → save as `RESEND_API_KEY`

---

## Phase 2 — Generate session secret (1 min)

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Save the output as `SESSION_SECRET`.

---

## Phase 3 — Deploy to Vercel (10 min)

```bash
cd "/Users/eliteworldservicespvtltd/CLAUDE PROJECT/uu-recruitment"
npm install -g vercel
vercel login
vercel link
```

Answer prompts: new project → name `uu-recruitment` → directory `./`.

### Push env vars to Vercel

Open <https://vercel.com/dashboard> → `uu-recruitment` → **Settings → Environment Variables**. Add EACH of these (scope: Production + Preview + Development):

| Variable | Value |
|---|---|
| `APP_AUTH_MODE` | `supabase` |
| `APP_STORAGE_MODE` | `supabase` |
| `APP_EMAIL_MODE` | `resend` |
| `NEXT_PUBLIC_SUPABASE_URL` | from Phase 1A.5 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Phase 1A.5 |
| `SUPABASE_SERVICE_ROLE_KEY` | from Phase 1A.5 ⚠️ |
| `DATABASE_URL` | from Phase 1A.6 (Transaction mode, with `?pgbouncer=…`) |
| `DIRECT_URL` | from Phase 1A.6 (Session mode) |
| `RESEND_API_KEY` | from Phase 1B.6 |
| `EMAIL_FROM` | `EWS Aviation Recruitment <aviation@ews.aero>` |
| `EMAIL_REPLY_TO` | `aviation@ews.aero` |
| `NEXT_PUBLIC_APP_URL` | `https://careers.ews.aero` |
| `NEXT_PUBLIC_APP_NAME` | `UU Aviation Recruitment 2026` |
| `SESSION_SECRET` | from Phase 2 |

### Run migration against prod DB

Locally, temporarily point `.env.local` at prod (swap `DATABASE_URL` + `DIRECT_URL`), then:

```bash
npx prisma migrate deploy
npm run seed                     # creates 4 rooms + 5 staff users
```

Revert `.env.local` back to local Postgres after.

### Deploy

```bash
vercel --prod
```

Wait ~3 min. Open the `https://uu-recruitment-xxx.vercel.app` URL → you should see the branded landing page.

---

## Phase 4 — Point custom domain (5 min)

1. Vercel → Project → **Settings → Domains** → Add `careers.ews.aero`
2. Vercel shows ONE CNAME record:

   | Type | Name | Value |
   |---|---|---|
   | CNAME | `careers` | `cname.vercel-dns.com` |

3. Add it at your DNS host. ⚠️ **At Cloudflare: Proxy = DNS only (gray cloud)**
4. SSL auto-provisions in 1–5 min
5. Open <https://careers.ews.aero> — landing page over HTTPS ✅

---

## Phase 5 — Production smoke test (5 min)

Walk through the critical path on the LIVE site:

- [ ] Landing page loads
- [ ] `/register` → email OTP → check you got a real email from `aviation@ews.aero`
- [ ] Complete the form with test data → token issued → confirmation email arrives → admit card PDF downloads
- [ ] `/admin/login` as `admin@ews.aero` → real OTP email → log in
- [ ] `/admin/runbook` → click "Print" → preview shows clean A4
- [ ] `/display` → open in full-screen browser tab → shows your test token

If anything fails: check Vercel build logs first, then function logs.

---

## Phase 6 — Drive-day prep (do over the next 3–5 days before the drive)

- **Daily email warm-up**: send 20–30 test emails from `/admin/emails` to varied gmail/outlook addresses. Check spam folders. Reputation builds.
- **Print 5 copies of the runbook** for the desk staff
- **Brief staff**: walk them through the 4 main flows (recruiter, desk operator, super admin)
- **Print QR codes** pointing at `https://careers.ews.aero/register`
- **Set up the TV**: mount, full-screen browser pointed at `/display`, test from across the room
- **Schedule backup cron**: on the machine where you'll run backups, `crontab -e`:
  ```
  0 2 * * * cd /path/to/uu-recruitment && ./scripts/backup.sh >> backups/backup.log 2>&1
  ```

---

## Post-drive

- `npm run backup` (or it runs nightly via cron)
- Export CSV from `/admin/students` for HR handoff
- `vercel env rm` any creds you want to rotate
- Archive Supabase project after 18 months (per consent policy)

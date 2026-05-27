# UU Aviation Recruitment — Setup Runbook

Written for a non-developer founder. Follow top to bottom. Total time: **~45 min** if all logins are ready.

---

## 0. Prerequisites (you already have these)

- ✅ Node.js 20+ installed
- ✅ GitHub account
- ✅ Vercel Pro account
- ✅ Supabase Pro account
- ✅ Resend free account
- ✅ Your domain (DNS access)

---

## 1. Create the Supabase project (5 min)

1. Go to <https://supabase.com/dashboard> → **New project**
2. Name: `uu-recruitment-prod`
3. Database password: **generate strong, save it in your password manager**
4. Region: **Mumbai (ap-south-1)** — closest to Uttarakhand
5. Plan: Pro (already on it)
6. Wait ~2 min for provisioning

### Grab the keys

Project Settings → **API**:
- `Project URL` → goes to `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → goes to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → goes to `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **never commit, never share**

Project Settings → **Database** → Connection string:
- **Transaction** mode, port **6543** → goes to `DATABASE_URL` (append `?pgbouncer=true&connection_limit=1`)
- **Session** mode, port **5432** → goes to `DIRECT_URL`

### Enable email OTP

Authentication → Providers → **Email**:
- Enable Email provider ✅
- Disable "Confirm email" ❌ (we use OTP, not magic links)
- Enable "Secure email change" ✅
- OTP expiry: **600 seconds** (10 min)
- OTP length: **6 digits**

Authentication → URL Configuration:
- Site URL: `https://YOURDOMAIN.com`
- Redirect URLs: add `https://YOURDOMAIN.com/**` and `http://localhost:3000/**`

### Storage

Storage → **New bucket** → name `student-documents`, **Private** (RLS-protected). Day 2 code will write upload policies.

---

## 2. Configure Resend + DNS (10 min — start the clock now, DNS takes time to propagate)

1. <https://resend.com> → Domains → **Add domain** → enter your domain
2. Resend shows you DNS records (SPF, DKIM, optionally DMARC). Add them at your DNS host (Cloudflare / Namecheap / GoDaddy / wherever you bought the domain).
3. Wait 10–30 min, then click **Verify** in Resend.
4. API Keys → **Create API Key** → name `prod`, full access → copy to `RESEND_API_KEY`.

### Warm the domain

A brand-new sending domain lands in spam. From now until drive day, every day send 20–30 real test emails to **gmail, yahoo, outlook, university addresses** — anywhere students might be.

---

## 3. Wire up `.env` locally (2 min)

```bash
cd "/Users/eliteworldservicespvtltd/CLAUDE PROJECT/uu-recruitment"
cp .env.example .env.local
# Edit .env.local — paste in all values from steps 1 & 2
```

The placeholder `.env` file from Prisma can be left as-is or replaced with `.env.local`. Both work — `.env.local` is the one Next.js + Prisma will read.

---

## 4. Push the schema to Supabase (3 min)

```bash
cd "/Users/eliteworldservicespvtltd/CLAUDE PROJECT/uu-recruitment"
npx prisma generate           # builds the typed client
npx prisma migrate dev --name init   # creates the 7 tables in Supabase
```

Verify in Supabase → Table Editor that you see: `Student`, `Token`, `Room`, `InterviewLog`, `User`, `EmailLog`, `AuditLog`.

---

## 5. Run locally (1 min)

```bash
npm run dev
```

Open <http://localhost:3000>. You should see the branded landing page (navy hero, green accents).

---

## 6. Deploy to Vercel (5 min)

```bash
npm install -g vercel    # one-time
vercel login
vercel link              # follow prompts: create new project "uu-recruitment"
vercel env pull          # syncs envs DOWN from Vercel (will be empty first time)
```

Then in Vercel dashboard → Project → **Settings → Environment Variables** → paste every variable from `.env.local` (set scope to **Production, Preview, Development**).

Push to deploy:

```bash
git add .
git commit -m "Day 1: scaffold + schema + brand"
git push origin main
```

Vercel auto-deploys. First build takes ~3 min.

---

## 7. Point your domain (5 min)

1. Vercel project → **Settings → Domains** → Add → enter `recruitment.YOURDOMAIN.com` (or apex — your call)
2. Vercel shows DNS records. Add at your DNS host:
   - For subdomain: a CNAME pointing to `cname.vercel-dns.com`
   - For apex: an A record to `76.76.21.21`
3. SSL provisions automatically in 1–5 min.

---

## ✅ Day 1 success checklist

- [ ] Supabase project live, all 7 tables visible
- [ ] Resend domain verified (green check)
- [ ] First test email landed in inbox (not spam)
- [ ] `.env.local` fully populated
- [ ] `npm run dev` shows branded landing page
- [ ] Deployed to Vercel
- [ ] Custom domain serves the landing page over HTTPS

If all 7 boxes tick — Day 1 done. Day 2 builds student registration on top.

---

## Daily commands reference

```bash
npm run dev              # local dev server
npx prisma studio        # GUI for the database
npx prisma migrate dev   # after any schema change
git push                 # triggers Vercel deploy
```

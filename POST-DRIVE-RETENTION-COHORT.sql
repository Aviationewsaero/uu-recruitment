-- ============================================================================
-- Post-drive registration cohort — IDENTIFICATION ONLY. READ-ONLY.
--
-- Produced 22-Aug-2026 during the InternAVIA 2.0 closure so the retention
-- decision can be made on real numbers instead of an estimate.
--
-- EVERY statement here is a SELECT. Nothing updates, deletes, anonymises or
-- exports. Deciding what happens to these records is a DPDP/business call and
-- is explicitly NOT an engineering action.
--
-- WHERE TO RUN: the careers.ews.aero (uu-recruitment) Supabase project.
--   NOT the InternAVIA project. These records live in a different database and
--   have never been in the InternAVIA talent pool — see the isolation note.
--
-- ISOLATION, VERIFIED IN CODE 22-Aug-2026 (why this is not urgent):
--   • uu-recruitment has NO cron jobs at all, so nothing reaches this cohort
--     on a schedule.
--   • The /register write path (src/lib/registration/actions.ts) creates
--     Student + Token ONLY. It never calls the InternAVIA talent ingest — that
--     is done solely by src/lib/direct-apply/actions.ts, the /apply and /join
--     forms. So these people are not in the InternAVIA pool and cannot receive
--     its job alerts or talent broadcasts.
--   • The only way to email them is bulk-email.ts, an admin-gated server action
--     that requires a human to compose a subject and body and press send.
--   • The drive gate is fail-safe closed (APP_DRIVE_OPEN must equal exactly
--     "true"), enforced in all registration actions, /register is absent from
--     the sitemap and disallowed in robots.txt. The cohort cannot grow.
-- ============================================================================

-- The drive concluded on this date. Anything registered after it was collected
-- for a purpose that had already ended.
--   \set drive_end '2026-05-29'

-- ── 1. How many, and over what period ───────────────────────────────────────
SELECT
  count(*)                                   AS post_drive_registrations,
  min(s."createdAt")::date                   AS earliest,
  max(s."createdAt")::date                   AS latest,
  min(t."tokenNumber")                       AS lowest_token,
  max(t."tokenNumber")                       AS highest_token
FROM "Student" s
JOIN "Token" t ON t."studentId" = s.id
WHERE s."createdAt" > DATE '2026-05-29';

-- ── 2. Shape of the cohort by month, to separate a tail from a trickle ──────
SELECT
  date_trunc('month', s."createdAt")::date AS month,
  count(*)                                 AS registrations
FROM "Student" s
WHERE s."createdAt" > DATE '2026-05-29'
GROUP BY 1
ORDER BY 1;

-- ── 3. Did any of them actually attend? ─────────────────────────────────────
-- A token that was called, started or completed belonged to someone who turned
-- up. Those are genuine participants and a different decision from a stray
-- sign-up that never became anything.
SELECT
  t.status,
  count(*) AS registrations,
  count(*) FILTER (WHERE t."completedAt" IS NOT NULL) AS completed_interview
FROM "Student" s
JOIN "Token" t ON t."studentId" = s.id
WHERE s."createdAt" > DATE '2026-05-29'
GROUP BY t.status
ORDER BY registrations DESC;

-- ── 4. What personal data is actually held ──────────────────────────────────
-- Counts only, no values. This is what a deletion would remove and what a
-- retention decision is therefore about.
SELECT
  count(*)                                              AS records,
  count(*) FILTER (WHERE s."fatherName" IS NOT NULL
                      OR s."motherName" IS NOT NULL)    AS with_parent_names,
  count(*) FILTER (WHERE s.address IS NOT NULL)         AS with_address,
  count(*) FILTER (WHERE s."graduationCgpa" IS NOT NULL) AS with_cgpa
FROM "Student" s
WHERE s."createdAt" > DATE '2026-05-29';

-- ── 5. Stored documents, which live in Supabase Storage, not Postgres ───────
-- Any deletion must remove the storage objects too, or the files outlive the
-- rows. Column names are read from the schema at run time so this stays honest
-- if the model changes.
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Student'
  AND (column_name ILIKE '%photo%'
    OR column_name ILIKE '%resume%'
    OR column_name ILIKE '%doc%'
    OR column_name ILIKE '%marksheet%'
    OR column_name ILIKE '%path%'
    OR column_name ILIKE '%url%')
ORDER BY column_name;

-- ── 6. Full list, for the decision only ─────────────────────────────────────
-- Deliberately last, and deliberately minimal: enough to identify a record,
-- not a PII export. Run it only if the decision needs per-record review, and do
-- not copy the output anywhere it will outlive the decision.
--
-- SELECT s."registrationId", t."tokenNumber", s."createdAt"::date, t.status
-- FROM "Student" s
-- JOIN "Token" t ON t."studentId" = s.id
-- WHERE s."createdAt" > DATE '2026-05-29'
-- ORDER BY t."tokenNumber";

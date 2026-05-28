# Architecture refactor roadmap

> **Status:** PLAN ONLY — do not apply during or within 2 weeks of the
> recruitment drive. Apply in 3 phases over 4–6 weeks post-drive.

## Why this document exists

The 7-day MVP build optimized for shipping. Server actions, Prisma calls,
domain logic, and email templates all sit in the same files. That was the
right call for the deadline — but it makes long-term evolution harder:

- Hard to unit-test business rules in isolation (every test needs Prisma + DB)
- Tight coupling to Next.js (would be painful to add a mobile API, CLI, or worker)
- Cross-cutting concerns (auth, audit, error handling) repeated in every action
- Generated Prisma types leak into the UI layer

This document defines the target structure (clean architecture, 4 layers) and
a phased migration plan that preserves behavior.

---

## Target structure (clean architecture, 4 layers)

```
src/
├── domain/                          # PURE — no framework, no I/O
│   ├── student/
│   │   ├── student.ts               # Entity + value objects
│   │   ├── student-status.ts        # Enum + transition rules
│   │   └── registration-id.ts       # Branded type + formatter
│   ├── token/
│   │   ├── token.ts
│   │   └── token-state-machine.ts   # Pure state-transition logic
│   ├── interview/
│   │   ├── decision.ts
│   │   └── rating.ts
│   ├── user/
│   │   ├── user.ts
│   │   └── role.ts                  # Capabilities matrix
│   └── shared/
│       ├── errors.ts                # DomainError, NotFoundError, etc.
│       └── result.ts                # Result<T, E> for error-as-value
│
├── application/                     # USE CASES — orchestrate domain + ports
│   ├── students/
│   │   ├── register-student.ts      # use case: register new student
│   │   └── search-students.ts
│   ├── interviews/
│   │   ├── call-next-token.ts
│   │   ├── submit-decision.ts
│   │   └── recall-skipped.ts
│   ├── communications/
│   │   ├── send-bulk-email.ts
│   │   └── send-decision-email.ts
│   ├── auth/
│   │   ├── login-with-password.ts
│   │   └── login-with-otp.ts
│   └── ports/                       # Interfaces only — implementations live in infra/
│       ├── student-repo.ts
│       ├── token-repo.ts
│       ├── email-sender.ts
│       ├── file-storage.ts
│       ├── otp-provider.ts
│       └── audit-logger.ts
│
├── infrastructure/                  # IMPLEMENTATIONS of ports + framework adapters
│   ├── persistence/
│   │   ├── prisma-client.ts         # Single Prisma instance (was lib/prisma.ts)
│   │   ├── prisma-student-repo.ts   # implements StudentRepo port
│   │   ├── prisma-token-repo.ts
│   │   ├── prisma-audit-logger.ts
│   │   └── mappers/                 # Prisma row ↔ domain entity
│   │       ├── student-mapper.ts
│   │       └── token-mapper.ts
│   ├── email/
│   │   ├── resend-sender.ts         # implements EmailSender
│   │   ├── console-sender.ts        # mock for dev
│   │   └── templates/               # HTML templates by name
│   ├── storage/
│   │   ├── supabase-storage.ts      # implements FileStorage
│   │   └── local-storage.ts         # mock for dev
│   ├── auth/
│   │   ├── supabase-otp-provider.ts
│   │   ├── mock-otp-provider.ts
│   │   ├── bcrypt-password-hasher.ts
│   │   └── hmac-session.ts          # HMAC-SHA256 cookie signer
│   └── container.ts                 # Composition root: wires ports → impls
│
└── presentation/                    # Next.js: routes, components, server actions
    ├── (public)/
    │   ├── page.tsx                 # landing
    │   └── register/                # student flow
    ├── admin/
    │   ├── layout.tsx
    │   ├── students/
    │   ├── users/
    │   └── ...
    ├── recruiter/
    ├── display/
    ├── api/                         # route handlers (CSV, admit-card, etc.)
    └── actions/                     # Thin Server Action wrappers — auth + call use case + revalidate
        ├── student-actions.ts
        ├── interview-actions.ts
        └── ...
```

### Dependency rule

Higher layers can depend on lower layers, never the reverse.

```
presentation  →  application  →  domain
                       ↓
                infrastructure  →  domain
```

**Concretely:**
- `domain/` imports nothing app-specific. Pure TypeScript.
- `application/` imports `domain/` only. References ports as interfaces.
- `infrastructure/` implements ports, imports `domain/` for mapping.
- `presentation/` imports `application/` (use cases) — never reaches into `infrastructure/` or `domain/` directly except for shared types.

Code today violates this — server actions in `src/lib/registration/actions.ts`
call `prisma.student.create()` directly, mix domain logic, email sending, and
audit log writes in one function body.

---

## Mapping current files → target structure

| Today | Target |
|---|---|
| `src/lib/prisma.ts` | `infrastructure/persistence/prisma-client.ts` |
| `src/lib/auth/{mock,supabase}.ts` | `infrastructure/auth/{mock,supabase}-otp-provider.ts` |
| `src/lib/auth/password.ts` | `infrastructure/auth/bcrypt-password-hasher.ts` |
| `src/lib/session.ts` | `infrastructure/auth/hmac-session.ts` |
| `src/lib/storage/*` | `infrastructure/storage/*` |
| `src/lib/email/{console,resend}.ts` | `infrastructure/email/{console,resend}-sender.ts` |
| `src/lib/email/templates.ts` | `infrastructure/email/templates/*.ts` (one file per template) |
| `src/lib/registration/schema.ts` | `domain/student/student.ts` (entity + validation) |
| `src/lib/registration/actions.ts` lines for txn | `application/students/register-student.ts` |
| `src/lib/registration/actions.ts` (Next.js wrapper) | `presentation/actions/student-actions.ts` |
| `src/lib/token-engine.ts` | Split: state machine → `domain/token/`, server actions → `presentation/actions/` |
| `src/lib/recruiter/actions.ts` | `application/interviews/submit-decision.ts` + `presentation/actions/` wrapper |
| `src/lib/admin/actions.ts` (login) | `application/auth/*` + `presentation/actions/auth-actions.ts` |
| `src/lib/admin/bulk-email.ts` | `application/communications/send-bulk-email.ts` |
| `src/lib/users/{service,actions}.ts` | Split: domain rules → `domain/user/`, use cases → `application/users/`, wrappers → `presentation/actions/` |

---

## Phased migration plan

### Phase 1 — Foundation (1 week)
**Goal:** Define ports + composition root without changing behavior.

1. Create `application/ports/` with interfaces extracted from current code:
   - `StudentRepo`, `TokenRepo`, `UserRepo`, `AuditLogger`
   - `EmailSender`, `FileStorage`, `OtpProvider`, `PasswordHasher`, `SessionStore`
2. Create `infrastructure/container.ts` that instantiates each port with its
   current implementation (Prisma, Resend, Supabase, etc.).
3. Update `prisma.ts` → move to `infrastructure/persistence/`, keep export
   re-export shim at old path to avoid mass churn.
4. **No behavior change. No file deletion.** Run full test suite after each step.

### Phase 2 — Extract use cases (2 weeks)
**Goal:** Move orchestration logic out of server actions into pure use-case functions.

For each server action that does more than 5 lines:
1. Identify the orchestration: validate → fetch → mutate → publish
2. Extract the body into `application/<context>/<action>.ts` as a function
   that takes ports as parameters.
3. Rewrite the server action to:
   ```typescript
   export async function submitRegistrationAction(...) {
     const user = await requireUser();
     const result = await registerStudent({
       input,
       studentRepo: container.studentRepo,
       tokenRepo: container.tokenRepo,
       emailSender: container.emailSender,
       audit: container.audit,
     });
     revalidatePath('/admin');
     return result;
   }
   ```
4. Write unit tests for the use case using in-memory fakes — no DB, no HTTP.
5. Repeat per server action.

### Phase 3 — Extract domain entities + mappers (1–2 weeks)
**Goal:** Stop leaking generated Prisma types into application/presentation.

1. For each entity (Student, Token, Room, etc.), define a domain type in
   `domain/<context>/<entity>.ts` — only the fields the business cares about.
2. Create `infrastructure/persistence/mappers/` to convert
   Prisma row ↔ domain entity.
3. Repos return domain entities, not Prisma types.
4. Use cases work entirely with domain types.
5. Mass-rename in presentation layer to import from domain, not from
   `@/generated/prisma`.

### Phase 4 — Testing + CI (1 week, parallel with above)
1. Vitest + in-memory fakes — unit-test every use case
2. Integration tests for repos against a Postgres test container
3. E2E with Playwright for the critical 3 flows (register, interview, login)
4. GitHub Actions: run unit + integration + typecheck on every PR

---

## What this gets you

| Property | Today | After refactor |
|---|---|---|
| Add an HTTP API for mobile app | Rewrite half the server actions | Add new presentation layer; use cases unchanged |
| Replace Prisma with Drizzle | Touch every file that does DB | Only `infrastructure/persistence/` |
| Replace Resend with SendGrid | Touch every file that sends mail | Only `infrastructure/email/resend-sender.ts` |
| Unit-test "what happens when a student registers" | Spin up Postgres + Vercel mock | Pure function call, mock ports |
| Onboard a new dev | "Read everything" | "Read `domain/` for what the business does, `application/` for how" |
| Add audit log to all mutations | Add lines in N actions | Decorate use case in container |

---

## What this does NOT change

- Public URLs (`/register`, `/admin/...`)
- Database schema
- API contracts
- User-visible behavior
- Deployment process (still `vercel --prod`)

---

## Anti-pattern to avoid

**Don't refactor for refactoring's sake.** Each phase ships incremental value:

- Phase 1 → enables Phase 2
- Phase 2 → use cases become testable + reusable
- Phase 3 → repository pattern lets you swap data stores
- Phase 4 → CI catches regressions before prod

If business demands shift (e.g. drive moves to mobile, multi-tenant
expansion), prioritize the phase that unlocks that. Otherwise: do them
in order, finish each before starting the next.

---

## Risks

- Adding indirection makes code harder to navigate short-term (Phase 1)
- Mass file moves create messy git diffs — do in many small PRs
- Existing team needs to learn the layer rules — pair on first 2–3 use cases
- TypeScript path aliases need updating (`@/domain/*`, `@/application/*` etc.)

---

## Acceptance criteria for "done"

- [ ] `npm run typecheck` passes
- [ ] All existing E2E tests pass (recruiter dashboard, student registration, admin CSV export)
- [ ] No `import { ... } from "@/generated/prisma"` in `presentation/` or `application/`
- [ ] No `import { prisma } from "@/lib/prisma"` outside `infrastructure/persistence/`
- [ ] Every use case has at least one unit test using in-memory fakes
- [ ] Container can swap any port for a fake (proven by unit tests)
- [ ] Onboarding doc updated to explain the layer rules

---

## When to start

**Not now.** Drive day comes first. Plan:
1. **Now → drive day:** zero refactoring. Bug fixes only.
2. **Drive day → +1 week:** debrief, fix urgent issues, archive data.
3. **+1 week → +5 weeks:** Phase 1 + Phase 2.
4. **+5 weeks → +7 weeks:** Phase 3.
5. **+7 weeks ongoing:** Phase 4 + new features built on the new structure.

Estimated effort: 4–6 weeks of focused work or 8–10 weeks part-time.

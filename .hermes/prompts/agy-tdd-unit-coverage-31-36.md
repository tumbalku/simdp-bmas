/build

You are Antigravity acting as the developer agent for SIMDP. Hermes/mes is orchestrating and will review your diff before any commit/PR. The user explicitly wants Antigravity and other developer agents to do the coding work; Hermes should only orchestrate/review except if you idle/error.

## Task

Implement the SIMDP test coverage roadmap for GitHub issues #31-#36 on the current branch.

Issues:
- #31 SIMDP-TEST-001: Setup Vitest unit test infrastructure
- #32 SIMDP-TEST-002: Unit tests for lib helpers
- #33 SIMDP-TEST-003: Unit tests for auth module
- #34 SIMDP-TEST-004: Unit tests for document module
- #35 SIMDP-TEST-005: Unit tests for employee, verification, notification, settings, security, statistics modules
- #36 SIMDP-TEST-006: API route and integration test baseline

## Important Context

Read these first:
- AGENTS.md
- README.md
- context/progress/task-board.md
- context/memory/changelog.md
- context/architecture/module-boundaries.md
- context/architecture/patterns.md
- context/coding-standards/golden-rules.md
- context/coding-standards/file-structure.md
- context/coding-standards/naming.md
- context/coding-standards/checklist.md
- context/security/auth-flow.md
- context/security/rbac.md
- context/domain/rbac.md
- context/technical/api/README.md
- context/technical/api/conventions.md
- .hermes/plans/2026-07-09_161854-tdd-unit-coverage-roadmap.md

## Current Project Facts

- Next.js 15 + TypeScript.
- Prisma + PostgreSQL.
- Zod v4 is used.
- `email: z.email("Format email tidak valid")` is correct and MUST NOT be converted to `z.string().email()`.
- PR #30 critical API security fixes has been merged into main.
- There are currently no existing test files.
- Prefer Vitest for TypeScript unit tests.

## Required Test Layout

Use this convention unless the existing code strongly requires a narrower adjustment:

```txt
src/lib/__tests__/
src/modules/<module>/__tests__/
tests/integration/api/
```

Unit tests close to modules:
- `src/lib/__tests__/api-response.test.ts`
- `src/lib/__tests__/auth.test.ts`
- `src/lib/__tests__/storage.test.ts`
- `src/modules/auth/__tests__/service.test.ts`
- `src/modules/document/__tests__/service.test.ts`
- module tests for employee, verification, notification, settings, security, statistics where practical

Integration/API baseline:
- `tests/integration/api/auth.test.ts`
- `tests/integration/api/documents.test.ts`
- `tests/integration/api/cron.test.ts`

## TDD/Legacy Test Rule

Existing code cannot be perfectly TDD because production code already exists. Treat tests as characterization/regression tests:
- For new helpers/config introduced during this task, use RED-GREEN-REFACTOR.
- For existing behavior, write behavior-focused tests and run them.
- Do not rewrite production code unless a test exposes a real issue or a tiny refactor is required for testability.

## Scope Rules

Allowed:
- Add Vitest and minimal testing dependencies.
- Add `npm run test` and optionally `npm run test:watch`.
- Add `vitest.config.ts` and test setup files.
- Add unit tests and small test factories/mocks.
- Add small refactors only when necessary to make existing code testable.
- Update `context/progress/task-board.md` and `context/memory/changelog.md` when completed.

Forbidden:
- Do not commit, push, merge, rebase, reset, or delete branches.
- Do not modify `.env` or print secrets.
- Do not replace architecture or module boundaries.
- Do not add unrelated UI changes.
- Do not change API contracts unless a test reveals a critical mismatch.
- Do not change `z.email("Format email tidak valid")`.
- Do not add broad Playwright/E2E unless strictly needed; this batch is unit/API baseline.

## Testing Priorities

Implement in this order:

### 1. Test Infrastructure (#31)
- Add Vitest config compatible with TS path aliases.
- Add scripts:
  - `test`
  - `test:watch`
- Ensure `npm run test` works.

### 2. Lib Tests (#32)
Cover:
- `src/lib/api-response.ts`: success/error envelopes, validation error formatting, BigInt serialization if exported/usable.
- `src/lib/auth.ts`: token hashing/generation or permission helpers that can be safely tested without relying on real cookies where possible.
- `src/lib/storage/index.ts`: local storage temporary URL generation, upload/delete with temp directory/mocks when practical.

### 3. Auth Tests (#33)
Cover critical behavior:
- login generic failure behavior for missing user/wrong password.
- refresh token hashing/rotation/revoke behavior.
- logout service boundary behavior.
- password reset stores hashed token and returns raw token.
- reset consumes hashed token and revokes sessions.

Use Prisma mocks, not a real DB, for unit tests.

### 4. Document Tests (#34)
Cover:
- upload validation/file magic byte helpers where accessible.
- ownership and role checks.
- restore document requires ADMIN.
- local stream path traversal rejection via route/integration-style test if practical.
- cron expiry/reminder behavior with deterministic dates where practical.

### 5. Remaining Modules (#35)
Add focused tests for:
- employee service/actions: ownership/admin guards and key validation behavior.
- verification service/actions: approve/reject rules and note validation.
- notification service: read/unread behavior.
- settings service/actions: defaults/update guard behavior.
- security service: filtering behavior.
- statistics service: aggregation behavior.

Prefer representative high-value tests over brittle tests that mirror every Prisma call.

### 6. API Baseline (#36)
Cover minimal route behavior:
- Auth route envelope behavior where easy to mock.
- Cron rejects missing/invalid Bearer secret and does not accept query secret.
- Document stream rejects traversal input before filesystem read.

## Verification Required Before You Stop

Run:

```bash
npm run test
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm run build
```

If a verification command fails, fix it. If blocked, leave a clear note in your final output and do not pretend it passed.

## Final Output Required

When finished, report:
- files changed
- test files added
- verification commands and results
- any remaining coverage gaps / risks
- whether you changed production code and why

Remember: no commit/push/merge. Hermes will review and ship.

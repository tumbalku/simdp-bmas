# SIMDP TDD Unit Coverage Roadmap Implementation Plan

> **For Hermes:** Hermes acts as orchestrator/reviewer only. Use Antigravity/other developer agents for implementation. Hermes may edit code only if the developer agent is idle/error or a critical blocker must be fixed.

**Goal:** Add a maintainable test strategy and unit-test baseline for the SIMDP codebase, then expand toward API/integration coverage without mixing unrelated production changes.

**Architecture:** Use a hybrid test layout: unit tests live close to the source under `src/lib/__tests__/` and `src/modules/<module>/__tests__/`; cross-module/API tests live under `tests/integration/`. Vitest is the recommended test runner for TypeScript unit tests in this Next.js project. Prefer behavior-focused tests and mocks at boundaries such as Prisma, cookies, route requests, and filesystem/storage.

**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL, Zod v4, Vitest, React/Node test utilities as needed.

---

## Current Context

- PR #30 critical API security fixes has been merged into `main`.
- There are currently no `*.test.*` files in the repo.
- `package.json` currently has no Vitest/Jest/Playwright test stack.
- User wants mes to maximize Antigravity usage and minimize Hermes/Codex coding token usage.
- User wants tests for code broadly, but this should be implemented as small GitHub issues instead of one unreviewable mega-PR.

## Backlog Issues

- #31 `SIMDP-TEST-001`: Setup Vitest unit test infrastructure
- #32 `SIMDP-TEST-002`: Unit tests for lib helpers
- #33 `SIMDP-TEST-003`: Unit tests for auth module
- #34 `SIMDP-TEST-004`: Unit tests for document module
- #35 `SIMDP-TEST-005`: Unit tests for employee, verification, notification, settings, security, statistics modules
- #36 `SIMDP-TEST-006`: API route and integration test baseline

## Test Layout Convention

```txt
src/
  lib/
    __tests__/
      api-response.test.ts
      auth.test.ts
      storage.test.ts
  modules/
    auth/
      __tests__/
        service.test.ts
        actions.test.ts
    document/
      __tests__/
        service.test.ts
        actions.test.ts
    employee/
      __tests__/
        service.test.ts
        actions.test.ts
    verification/
      __tests__/
        service.test.ts
        actions.test.ts
    notification/
      __tests__/
        service.test.ts
    settings/
      __tests__/
        service.test.ts
        actions.test.ts
    security/
      __tests__/
        service.test.ts
    statistics/
      __tests__/
        service.test.ts

tests/
  integration/
    api/
      auth.test.ts
      documents.test.ts
      cron.test.ts
```

## Implementation Strategy

### Phase 1 — Test Infrastructure (#31)

**Objective:** Add a test runner and a stable test convention before writing many tests.

**Expected files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts` or `tests/setup.ts`
- Create: `src/test/factories.ts` if useful

**Requirements:**
- Add `npm run test` and `npm run test:watch` scripts.
- Configure TS path alias `@/*` correctly.
- Default unit test environment should be `node` unless a specific test needs DOM.
- Use mocks for Prisma boundary; do not require a real DB for unit tests.
- Verification: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`.

### Phase 2 — Lib Helper Tests (#32)

**Objective:** Cover reusable helpers that other module tests will rely on.

**Targets:**
- `src/lib/api-response.ts`
- `src/lib/auth.ts`
- `src/lib/env.ts` where practical without leaking secrets
- `src/lib/storage/index.ts`

**Behaviors to cover:**
- Success/error response envelope shape.
- Zod validation error formatting.
- BigInt-safe serialization behavior.
- Token hashing/refresh token helpers.
- Local storage URL generation and deletion behavior using temp paths/mocks.

### Phase 3 — Auth Module Tests (#33)

**Objective:** Cover critical auth behavior first because it affects all protected routes.

**Targets:**
- `src/modules/auth/service.ts`
- `src/modules/auth/actions.ts`
- route handlers under `src/app/api/v1/auth/` where useful

**Behaviors to cover:**
- Login by email/NIK/NIP returns same generic failure on bad credentials.
- Refresh token is hashed at rest.
- Session rotation revokes old token and creates new hashed token.
- Logout calls service boundary and revokes token.
- Password reset stores hashed token but returns raw token for future email delivery.
- `z.email("Format email tidak valid")` remains unchanged; do not convert to `z.string().email()`.

### Phase 4 — Document Module Tests (#34)

**Objective:** Lock down high-risk document upload/download/lifecycle logic.

**Targets:**
- `src/modules/document/service.ts`
- `src/modules/document/actions.ts`
- `src/app/api/v1/documents/download/stream/route.ts`
- `src/app/api/v1/documents/upload/route.ts`

**Behaviors to cover:**
- File magic-byte validation for PDF/PNG/JPEG.
- Reject unsupported extension/MIME/oversized file.
- Reject path traversal input such as `../../.env` and encoded variants.
- Employee ownership guard for download/delete.
- Restore document requires `ADMIN`.
- Expiry reminder logic with deterministic/frozen date.

### Phase 5 — Remaining Module Tests (#35)

**Objective:** Add focused unit tests for lower-risk modules without over-mocking every implementation detail.

**Targets:**
- `src/modules/employee/*`
- `src/modules/verification/*`
- `src/modules/notification/*`
- `src/modules/settings/*`
- `src/modules/security/*`
- `src/modules/statistics/*`

**Behaviors to cover:**
- Role/ownership guards.
- Validation boundaries.
- Query filter construction where public behavior depends on it.
- Audit/log side-effect invocation when required.
- Aggregation math for statistics.

### Phase 6 — API/Integration Baseline (#36)

**Objective:** Add a small integration layer after unit coverage exists.

**Targets:**
- `tests/integration/api/auth.test.ts`
- `tests/integration/api/documents.test.ts`
- `tests/integration/api/cron.test.ts`

**Behaviors to cover:**
- Auth route request/response envelopes.
- Refresh/logout route works when access token is expired/missing but refresh cookie exists where appropriate.
- Cron requires `Authorization: Bearer`, not `?secret=`.
- Document stream path traversal is rejected.

## Antigravity Orchestration Rules

- Hermes creates detailed prompts and starts `agy`.
- Antigravity implements code and tests.
- Hermes monitors changed-file mtimes.
- If no file changes for 5 minutes, Hermes polls/reconnects/checks logs 3 times over 3 minutes.
- If still idle/error, Hermes kills agy and takes over only for critical completion/fix.
- Antigravity must not commit, push, merge, delete branches, touch `.env`, or print secrets.
- Hermes reviews diff, runs verification, then commits/pushes/opens PR.

## Recommended PR Strategy

Prefer one PR per issue if time allows:

```txt
PR A: #31 infra
PR B: #32 lib helpers
PR C: #33 auth module
PR D: #34 document module
PR E: #35 remaining modules
PR F: #36 integration baseline
```

If the user explicitly wants one batch PR, Antigravity may implement #31-#36 on one branch, but Hermes must label it high-review-risk because test infra plus many test files can hide regressions.

## Verification Gate

Before PR:

```bash
npm run test
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm run build
```

If tests require env, use the local `.env` already configured for Docker PostgreSQL and never print secrets.

## Risks

- Large test PR can become noisy; prefer phased PRs.
- Unit tests around Prisma-heavy services can over-mock implementation details. Test public behavior and service outputs instead.
- Existing code was not written test-first, so this is characterization/regression test coverage, not strict TDD for legacy code. Use strict TDD for any new helper introduced during testing.
- Route handler tests may need careful mocking of `next/headers` cookies and filesystem APIs.

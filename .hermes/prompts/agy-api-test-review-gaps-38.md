/build

You are Antigravity acting as the developer agent for SIMDP. Hermes/mes is orchestrating and will review your diff before any commit/PR. The user explicitly wants Antigravity/other agents to do the coding work; Hermes edits only if you idle/error.

## Task

Implement GitHub issue #38: `SIMDP-TEST-007: Address API route and test suite review gaps`.

Review source: `review-api-and-integration-test.md` is present as a local scratch review file if accessible. Treat it as input only; do not commit it.

## Must-read context first

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
- review-api-and-integration-test.md

## Non-negotiable constraints

- Do not commit, push, merge, rebase, reset, delete branches, or change GitHub settings.
- Do not touch `.env` or print secrets.
- Preserve `email: z.email("Format email tidak valid")`; do NOT change it to `z.string().email()`.
- Route Handlers call services, not Prisma directly.
- Keep production changes minimal and covered by tests.
- Use TDD style for behavior changes: add/adjust failing test first, then implement minimal fix.
- Do not commit the scratch file `review-api-and-integration-test.md`.
- Do not commit `.hermes/tmp-simdp-test-007-issue.md` if present.

## Review findings to implement

### C2 — Cross-platform storage test path assertions

File: `src/lib/__tests__/storage.test.ts`

Problem: tests hardcode Windows path separator `\\`, e.g. assertions containing `uploads\\docs`. This can fail on Linux/macOS CI.

Required:
- Replace hardcoded path separator assertions with `path.join(...)`, `path.sep`, or path normalization.
- Keep tests meaningful: still verify upload/delete paths are under the expected uploads/docs path.

### C1 — Replace fragile route error mapping in document routes

Files:
- `src/app/api/v1/documents/upload/route.ts`
- `src/app/api/v1/documents/download/[id]/route.ts`
- likely `src/modules/document/service.ts` or a shared error helper if needed.

Problems:
- `upload/route.ts` uses `error.message.includes(...)` for status mapping and has `eslint-disable @typescript-eslint/no-explicit-any`.
- `download/[id]/route.ts` uses string matching and `any` catch.

Required:
- Introduce a typed/custom error pattern where appropriate, e.g. `AppError` / `DocumentError` with `code`, `status`, and `message`, or equivalent strongly typed helper.
- Map document service errors to API error responses without fragile `includes()` checks.
- Remove `eslint-disable @typescript-eslint/no-explicit-any` from upload/download-by-id routes.
- Catch errors as `unknown` and narrow with `instanceof Error` / custom error guard.
- Preserve route thinness: route handler should only parse/guard/call service/map typed errors.
- Add/adjust tests that prove the mapping works.

### M1 — Add auth integration tests

File: `tests/integration/api/auth.test.ts`

Add coverage for:
- `POST /api/v1/auth/logout`
  - unauthenticated -> 401
  - authenticated with refresh cookie -> success, calls cookie clear behavior and logout service path.
  - authenticated without refresh cookie -> still success and clears cookies.
- `POST /api/v1/auth/forgot-password`
  - invalid email -> validation error.
  - valid email -> 200 generic message (anti-enumeration), without leaking whether account exists.
- `POST /api/v1/auth/reset-password`
  - mismatched confirmation -> validation error on confirmPassword.
  - invalid token -> 400 BAD_REQUEST.
  - valid token -> success.

Use existing test patterns/mocks. Avoid brittle implementation-detail assertions unless necessary.

### M2 — Add document API integration tests

File: `tests/integration/api/documents.test.ts`

Add coverage for:
- `POST /api/v1/documents/upload`
  - unauthenticated -> 401.
  - missing `documentTypeId` or missing file -> validation error.
  - valid minimal multipart request -> success with service mocked or Prisma/storage mocked consistently with existing suite.
- `GET /api/v1/documents/download/[id]`
  - unauthenticated -> 401.
  - ownership error -> 403.
  - not found -> 404.
  - success -> returns `{ url }` envelope.

### M3 — Remove explicit-any eslint disables in route files

Files:
- `src/app/api/v1/documents/upload/route.ts`
- `src/app/api/v1/documents/download/[id]/route.ts`
- `src/app/api/v1/cron/check-expiry/route.ts`

Required:
- Remove `/* eslint-disable @typescript-eslint/no-explicit-any */` where present.
- Convert `catch (error: any)` to `catch (error: unknown)`.
- Use safe error narrowing.

### M4 — Standardize login password minimum length

Files:
- `src/app/api/v1/auth/login/route.ts`
- tests as needed.

Current review: login min password 6 while reset-password min 8.

Required:
- If safe, standardize login schema min password to 8 for consistency.
- Update integration tests accordingly.
- Do not change reset-password behavior.

### L1 — Timing-safe CRON_SECRET comparison

File: `src/app/api/v1/cron/check-expiry/route.ts`

Required:
- Use timing-safe comparison if compatible with this Node route runtime.
- Since this route uses server modules, `crypto.timingSafeEqual` is acceptable if the route remains Node-compatible.
- Avoid throwing on length mismatch; return false safely.
- Preserve behavior: only `Authorization: Bearer <secret>` works; query string secret remains rejected.
- Add/adjust tests if useful.

### L2 — Expired JWT tests

File: `src/lib/__tests__/auth.test.ts`

Add tests:
- `verifyAccessToken` returns null for expired token.
- `requireAuth` throws `UNAUTHENTICATED` for expired access token.

Use `jose.SignJWT` or the existing helper with expiration control if available.

### L3 — Document type UPDATE/DELETE tests

File: `src/modules/document/__tests__/service.test.ts`

Add tests for:
- `handleDocumentTypeCrud("UPDATE", ...)`
- `handleDocumentTypeCrud("DELETE", ...)`

### L4 — ADMIN/STAFF cross-employee download tests

File: `src/modules/document/__tests__/service.test.ts`

Add tests:
- ADMIN can generate download URL for document owned by another employee.
- STAFF can generate download URL for document owned by another employee, if service policy permits STAFF.

If actual policy permits only ADMIN/STAFF from existing service behavior, reflect that behavior; do not invent policy.

## Docs/progress updates

Update:
- `context/progress/task-board.md`: add #38 and mark done only after implementation/verification passes.
- `context/memory/changelog.md`: add a Fixed/Changed/Test entry summarizing #38.

Do not commit local scratch review files.

## Verification required before stopping

Run all of these:

```bash
npm run test
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm run build
```

If any command fails, fix it. If blocked, report exact blocker and do not claim pass.

## Final response required

Report:
- files changed
- production code changed and why
- tests added/changed
- verification commands/results
- remaining risks/gaps

Again: do not commit/push/merge. Hermes will review and ship.

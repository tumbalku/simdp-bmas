/build

You are Antigravity acting as the developer agent for SIMDP. Hermes/mes is orchestrating and will review your diff before any commit/PR. The user explicitly asked to implement all API issues #15-#26 automatically, but you must keep the work safe, incremental, and verifiable.

Current branch: `feat/api-implementation-15-26` from latest `main` after API docs PR #27 merge.

Goal: Implement SIMDP API issues #15-#26 according to the docs-first contracts. This is coding work, not more planning.

GitHub issues to implement:
- #15 SIMDP-API-001: API foundation
- #16 SIMDP-API-002: Auth API
- #17 SIMDP-API-003a: Employee Profile & Career History API
- #18 SIMDP-API-003b: Admin Employee CRUD & CSV Import API
- #19 SIMDP-API-003c: Master Data HR Administration API
- #20 SIMDP-API-004a: Document Type Administration API
- #21 SIMDP-API-004b: Document Records & Upload API
- #22 SIMDP-API-004c: Document Download & Lifecycle API
- #23 SIMDP-API-005a: Document Verification Workflow API
- #24 SIMDP-API-005b: In-App Notifications API
- #25 SIMDP-API-006a: System Settings & Security Audit Log API
- #26 SIMDP-API-006b: Dashboard Statistics & Expiry Cron API

Mandatory context to read before editing:
- AGENTS.md
- README.md
- package.json
- prisma/schema.prisma
- prisma.config.ts
- context/progress/task-board.md
- context/memory/changelog.md
- context/architecture/module-boundaries.md
- context/architecture/patterns.md
- context/coding-standards/golden-rules.md
- context/coding-standards/file-structure.md
- context/coding-standards/naming.md
- context/coding-standards/checklist.md
- context/technical/database.md
- context/technical/environment.md
- context/technical/api/README.md
- context/technical/api/conventions.md
- context/technical/api/auth.md
- context/technical/api/employee-master-data.md
- context/technical/api/documents.md
- context/technical/api/verification-notification.md
- context/technical/api/system.md
- context/technical/api/review-implementation-split.md
- context/security/auth-flow.md
- context/security/rbac.md
- context/security/audit.md
- context/domain/entities.md
- context/domain/business-rules.md
- context/domain/rbac.md

Hard constraints:
- Do NOT commit, push, merge, rebase, reset, or delete branches.
- Do NOT edit `.env` or print secrets. If a value looks secret, redact it.
- Do NOT bypass module boundaries. Cross-module access must go through target module `service.ts`; never import another module's repository directly.
- Use `src/lib/prisma.ts` only for Prisma Client access. Do not create another Prisma Client.
- Use `src/lib/env.ts` for environment variables. Do not read `process.env` directly outside env validation/config boundaries.
- Client components must not call `fetch()` directly. Frontend API calls must go through module `api.ts` and hooks through module `hooks.ts`.
- Validate all external input with Zod.
- Sensitive actions must create audit/security logs as contracted.
- Do not introduce unrelated UI redesign/refactors.
- Touch only files needed for API implementation and context updates.

Implementation strategy:
1. Inspect existing `src/` structure before creating files.
2. Implement foundation first (#15): response envelope helpers, error helpers, auth/session helpers, role/ownership guards, Zod error mapping.
3. Implement auth (#16) before dependent modules.
4. Implement modules in dependency order: employee/master data, document type, upload/download, verification/notification, system/statistics/cron.
5. Keep services/repositories/actions route handlers consistent with existing project structure.
6. If a full issue cannot be completed safely, implement the safe subset and write a clear TODO/risk in the final summary; do not fake completion.
7. Update `context/progress/task-board.md` and `context/memory/changelog.md` only for tasks actually implemented and verified.
8. Keep GitHub issue closing for Hermes/PR body; do not close issues yourself.

Expected implementation locations, adjusted to existing repo conventions:
- `src/lib/api-response.ts`, `src/lib/auth*`, `src/lib/security*`, `src/lib/storage/*` as needed.
- `src/modules/auth/*` and `src/app/api/v1/auth/**/route.ts`.
- `src/modules/employee/*` for profile, employee admin, career history, master data.
- `src/modules/document/*` and `src/app/api/v1/documents/**/route.ts`.
- `src/modules/verification/*`, `src/modules/notification/*`.
- `src/modules/settings/*`, `src/modules/security/*`, `src/modules/statistics/*`, `src/app/api/v1/cron/check-expiry/route.ts`.

Verification required before final response:
- npm run prisma:validate
- npm run prisma:generate
- npm run lint
- npm run typecheck
- npm run build

If tests/build fail:
- Fix root cause if reasonable.
- Retry verification after fixes.
- Stop after about 3 attempts on the same failing file/category and report the blocker clearly.

Final response must include:
- Issues completed / partially completed / blocked.
- Files changed summary.
- Verification command results.
- Known risks and manual review notes.
- Whether Hermes should commit/push/open PR or continue fixing blockers.

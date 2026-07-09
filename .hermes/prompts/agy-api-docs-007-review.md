/review

You are Antigravity acting as reviewer for SIMDP. Hermes/mes is orchestrating and will verify your output. This is SIMDP-API-DOCS-007.

Goal: Review all API contract docs against RBAC, audit log, Zod validation, module boundaries, frontend needs, and Prisma schema; then produce a clear implementation issue breakdown. Documentation only.

Current branch: docs/api-docs-roadmap.
Existing uncommitted docs from Hermes/Antigravity must be preserved.

Must read:
- AGENTS.md
- context/progress/task-board.md
- context/memory/changelog.md
- context/technical/api/README.md
- context/technical/api/conventions.md
- context/technical/api/auth.md
- context/technical/api/employee-master-data.md
- context/technical/api/documents.md
- context/technical/api/verification-notification.md
- context/technical/api/system.md
- context/technical/api-contracts.md
- context/security/auth-flow.md
- context/security/rbac.md
- context/security/audit.md
- context/domain/rbac.md
- context/domain/entities.md
- context/domain/business-rules.md
- context/architecture/module-boundaries.md
- context/architecture/patterns.md
- context/coding-standards/golden-rules.md
- context/technical/database.md
- context/technical/environment.md
- prisma/schema.prisma

Create one review/split file:
- context/technical/api/review-implementation-split.md

Update:
- context/technical/api/README.md
- context/progress/task-board.md
- context/memory/changelog.md

Do NOT:
- edit src/
- edit package.json or lockfiles
- edit Prisma schema/migrations
- edit env/secrets
- run git commit/push/merge/rebase/reset/delete branches
- create GitHub issues yourself; Hermes will do that after checking your issue breakdown

Review requirements:
1. For each contract file (conventions, auth, employee-master-data, documents, verification-notification, system), mark verdict: READY FOR IMPLEMENTATION, READY WITH NOTES, or NEEDS CHANGES.
2. Check at minimum:
   - RBAC and ownership explicit
   - audit events for sensitive actions
   - planned Zod validation for external input
   - module boundaries/service.ts only
   - no direct frontend fetch from components
   - response envelope and error shape consistency
   - soft delete handling where applicable
   - Prisma schema/domain rule consistency
   - no secret/token leakage in response examples
3. If you find issues, make small doc corrections directly when safe. If a decision is needed, list it as open question instead of inventing policy.
4. In review-implementation-split.md, include:
   - Executive summary
   - Review matrix per contract file
   - Cross-cutting findings
   - Open questions/risks
   - Implementation issue breakdown with proposed GitHub issue titles, scopes, acceptance criteria, files likely to change, verification commands, and dependencies/order.

Implementation issue breakdown should include at least these issues:
- SIMDP-API-001 foundation
- SIMDP-API-002 auth
- SIMDP-API-003 employee/master-data
- SIMDP-API-004 documents
- SIMDP-API-005 verification/notification
- SIMDP-API-006 settings/security/statistics/cron

But split further if a task is too large. Keep issues small and company-style.

After creating review-implementation-split.md:
- Update context/technical/api/README.md status table: mark contract docs as `Ready for implementation` if review passes, otherwise `Ready with notes`.
- Move SIMDP-API-DOCS-007 from Backlog to Done in context/progress/task-board.md with date 2026-07-09 if review is complete.
- Keep API implementation issues in Backlog, but update descriptions if your split changes them.
- Add a concise changelog entry for SIMDP-API-DOCS-007.

Verification to run:
- git diff --check
- npm run lint
- npm run typecheck
- npm run build

Final response: summarize review verdicts, files changed, commands run, open questions, and recommend whether Hermes should create GitHub implementation issues. Do not commit.
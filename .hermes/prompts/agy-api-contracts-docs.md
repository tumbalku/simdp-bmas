/build

You are Antigravity acting as the developer agent for SIMDP. Hermes/mes is orchestrating and will review your diff. Work only in documentation/context files; do not implement API code.

Goal: complete the API docs-first contracts for the remaining SIMDP API documentation backlog items:
- SIMDP-API-DOCS-002: Auth API contracts
- SIMDP-API-DOCS-003: Employee & Master Data API contracts
- SIMDP-API-DOCS-004: Document Type & Document Record API contracts
- SIMDP-API-DOCS-005: Verification & Notification API contracts
- SIMDP-API-DOCS-006: Settings, Security Log, Statistics, and Cron expiry contracts

Current branch: docs/api-docs-roadmap.
There are existing uncommitted docs changes from Hermes for SIMDP-API-DOCS-001. Preserve them and build on them.

Must read and follow these files before editing:
- AGENTS.md
- README.md
- context/progress/task-board.md
- context/memory/changelog.md
- context/technical/api-contracts.md
- context/technical/api/README.md
- context/technical/api/conventions.md
- context/security/auth-flow.md
- context/security/rbac.md
- context/security/audit.md
- context/domain/rbac.md
- context/domain/entities.md
- context/domain/business-rules.md
- context/architecture/module-boundaries.md
- context/architecture/patterns.md
- context/coding-standards/golden-rules.md
- context/coding-standards/file-structure.md
- context/coding-standards/naming.md
- context/coding-standards/checklist.md
- context/technical/database.md
- context/technical/environment.md
- prisma/schema.prisma

Files to create:
- context/technical/api/auth.md
- context/technical/api/employee-master-data.md
- context/technical/api/documents.md
- context/technical/api/verification-notification.md
- context/technical/api/system.md

Files to update:
- context/technical/api/README.md: update status matrix so the five new docs show Ready for review, and keep conventions.md as Ready for review.
- context/progress/task-board.md: move SIMDP-API-DOCS-002 through SIMDP-API-DOCS-006 from Backlog to Done with date 2026-07-09. Leave SIMDP-API-DOCS-007 in Backlog.
- context/memory/changelog.md: add one concise Added entry for SIMDP-API-DOCS-002 through SIMDP-API-DOCS-006.
- context/technical/api-contracts.md: add links to the new detailed API contract files in the Docs-first Workflow section or near Route Handlers; do not duplicate all details there.

Hard constraints:
- Documentation only. Do NOT create or edit any file under src/.
- Do NOT modify package.json, lockfiles, Prisma schema, migrations, .env, or secrets.
- Do NOT run git commit, git push, branch deletion, reset, rebase, or merge.
- Do NOT use --dangerously-skip-permissions.
- Do NOT invent implementation code. You may mention future file paths and Zod schema names as planned contracts.
- Maintain module boundaries: Route Handlers/Server Actions call service.ts; service calls same-module repository only.
- All external inputs must have planned Zod validation.
- Sensitive actions must include audit event notes.
- Employee ownership rules must be explicit.
- Frontend must not fetch directly in components; all frontend request notes go through module api.ts/hooks.ts.

For each contract file, use the template and conventions in context/technical/api/conventions.md. Include enough request/response detail for Frontend to implement forms, tables, loading/error states, cache invalidation, and API wrapper typing later.

Required coverage:

1) context/technical/api/auth.md
Cover:
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password
- changePasswordAction(data)
- revokeSessionAction(tokenId)
- revokeAllSessionsAction()
Include cookie behavior, flexible identifier rules, single-device enforcement, refresh token hashing, generic responses for forgot-password, rate limit notes, audit events, frontend caller notes, cache/session invalidation.

2) context/technical/api/employee-master-data.md
Cover:
- get current profile
- updateProfileAction(data)
- employee list/detail/create/update/soft-delete/restore
- importEmployeesAction(csv)
- career history list/add
- CRUD contracts for EmploymentStatus, EmployeeGroup, ProfessionGroup, EmployeePosition, EmployeeRank, Workplace
Include pagination/filter/sort, NIP/NIK requirement, Admin-only rules, Employee self-only profile rule, soft delete visibility, audit events, frontend table/form notes.

3) context/technical/api/documents.md
Cover:
- document type list/detail/create/update/soft-delete/restore
- document type target relations/assignment rules
- document record list/detail
- POST /api/v1/documents/upload
- GET /api/v1/documents/download/[id]
- softDeleteDocumentAction(id)
- restoreDocumentAction(id)
Include upload FormData fields, conditional metadata requirements, MIME/content validation, SHA-256, storage provider boundary, temporary URL rule, owner/staff/admin access, allowMultipleSnapshot trigger note, cache invalidation.

4) context/technical/api/verification-notification.md
Cover:
- verification queue/list
- verifyDocumentAction(id, decision, note) for approve/reject
- verification history list
- notification list/unread count
- markNotificationReadAction(id)
- markAllNotificationsReadAction()
Include Staff minimum role, reject note required, VerificationHistory creation, notification side effects, audit events, Employee ownership visibility.

5) context/technical/api/system.md
Cover:
- system settings list/update
- security log list/detail/filter
- statistics dashboard read contracts
- GET /api/v1/cron/check-expiry
Include Admin-only rules, statistics read-only constraint, CRON_SECRET, reminder H-30/H-7/H-1 idempotency, no frontend use for cron, audit events.

After editing, run:
- git diff --check
- npm run lint
- npm run typecheck
- npm run build

Final response should summarize files changed, commands run, and any open questions. Do not commit.
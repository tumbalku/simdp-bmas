# SIMDP API Docs-first Roadmap Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Membuat dokumentasi kontrak API SIMDP v1 terlebih dahulu, lalu baru masuk implementasi API secara bertahap.

**Architecture:** SIMDP memakai Next.js App Router dengan REST Route Handler untuk `/api/v1/*`, Server Actions untuk mutasi dashboard/form internal, module boundary `service.ts`, validasi Zod, custom JWT, Prisma/PostgreSQL, dan audit log untuk aksi sensitif. Semua endpoint harus didesain dari kontrak yang jelas sebelum kode dibuat.

**Tech Stack:** Next.js 15, TypeScript, Prisma 7, PostgreSQL/Supabase, Zod, custom JWT via httpOnly cookies.

---

## Current Context

- `main` sudah bersih dan sinkron setelah PR DB-003 merge.
- Database baseline sudah tersedia di `prisma/schema.prisma` dan `prisma/migrations/20260709000000_init/migration.sql`.
- API draft awal ada di `context/technical/api-contracts.md`, tetapi masih perlu dipecah menjadi kontrak detail per kelompok endpoint.
- Fokus berikutnya adalah **API first**, tetapi **docs first before coding**.
- Tidak boleh mulai implementasi route handler/service/repository sebelum kontrak API terkait selesai dan direview.

## Source Documents to Respect

- `context/technical/api-contracts.md`
- `context/security/auth-flow.md`
- `context/security/rbac.md`
- `context/domain/entities.md`
- `context/domain/business-rules.md`
- `context/architecture/module-boundaries.md`
- `context/architecture/patterns.md`
- `context/coding-standards/golden-rules.md`
- `prisma/schema.prisma`

---

## Proposed Documentation Structure

Create docs under:

```txt
context/technical/api/
├── README.md
├── conventions.md
├── auth.md
├── employee-master-data.md
├── documents.md
├── verification-notification.md
└── system.md
```

Recommended responsibilities:

- `README.md`: index, implementation order, status matrix.
- `conventions.md`: response envelope, error shape, pagination, date format, auth cookie behavior, role notation, audit notation.
- `auth.md`: login, refresh, logout, forgot/reset password, change password, revoke sessions.
- `employee-master-data.md`: profile, employee CRUD, career history, and master data CRUD.
- `documents.md`: document type CRUD, target rules, upload, download/preview, document soft delete/restore.
- `verification-notification.md`: approve/reject flow, verification history, notification read state.
- `system.md`: settings, security log, statistics, cron expiry reminder.

---

## Contract Template

Each endpoint/action contract should use this shape:

```md
## <METHOD> <PATH or ACTION NAME>

**Status:** Draft | Reviewed | Ready for implementation
**Module:** `<module>`
**Handler Type:** Route Handler | Server Action
**Minimum Role:** Public | EMPLOYEE | STAFF | ADMIN | System
**Ownership Rule:** ...

### Purpose

...

### Request

#### Params

| Name | Type | Required | Notes |
|---|---|:---:|---|

#### Query

| Name | Type | Required | Notes |
|---|---|:---:|---|

#### Body / Form Data

```json
{}
```

### Success Response

```json
{}
```

### Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|

### Validation

- Zod schema to create: `<schemaName>`
- Important validation rules:

### Service Boundary

- Route/action calls: `src/modules/<module>/service.ts`
- Service may call its own repository only.

### Side Effects

- Database:
- Storage:
- Notification:
- Audit:

### Verification Plan

- Unit/service checks:
- Route/action checks:
- Commands:
```

---

## Step-by-step Plan

### Task 1: Create API docs conventions

**Objective:** Define API documentation standard before endpoint-specific docs.

**Files:**
- Create: `context/technical/api/README.md`
- Create: `context/technical/api/conventions.md`
- Modify: `context/technical/api-contracts.md`
- Modify: `context/progress/task-board.md`

**Steps:**
1. Create `context/technical/api/README.md` with docs index and status matrix for all API groups.
2. Create `context/technical/api/conventions.md` with response envelope, error shape, role notation, audit notation, pagination, and date/time conventions.
3. Move `SIMDP-API-DOCS-001` from Backlog to In Progress while working, then Done after review.
4. Do not create implementation files.

**Verification:**

```bash
git diff --check
npm run lint
npm run typecheck
```

### Task 2: Document Auth API contracts

**Objective:** Complete contracts for authentication endpoints and session actions.

**Files:**
- Create: `context/technical/api/auth.md`
- Modify: `context/technical/api/README.md`
- Modify: `context/progress/task-board.md`

**Endpoints/actions to document:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `changePasswordAction(data)`
- `revokeSessionAction(tokenId)`
- `revokeAllSessionsAction()`

**Must include:**
- httpOnly cookie behavior.
- single-device login rule.
- refresh token hashing rule.
- rate limiting expectation.
- audit events from `context/security/auth-flow.md`.

**Verification:**

```bash
git diff --check
npm run lint
npm run typecheck
```

### Task 3: Document Employee & Master Data API contracts

**Objective:** Define contracts for employee profile, admin employee management, career history, and master data.

**Files:**
- Create: `context/technical/api/employee-master-data.md`
- Modify: `context/technical/api/README.md`
- Modify: `context/progress/task-board.md`

**Contracts to document:**
- current user profile read/update.
- employee list/detail/create/update/soft-delete/restore.
- career history add/list.
- employment status CRUD.
- employee group CRUD.
- profession group CRUD.
- employee position CRUD.
- employee rank CRUD.
- workplace CRUD.

**Must include:**
- Admin-only management rules.
- Employee self-only profile rules.
- NIP/NIK identifier requirement.
- soft delete filtering.
- audit requirements for sensitive changes.

**Verification:**

```bash
git diff --check
npm run lint
npm run typecheck
```

### Task 4: Document Document API contracts

**Objective:** Define contracts for document types, target rules, upload, preview/download, soft delete, and restore.

**Files:**
- Create: `context/technical/api/documents.md`
- Modify: `context/technical/api/README.md`
- Modify: `context/progress/task-board.md`

**Contracts to document:**
- document type list/detail/create/update/soft-delete/restore.
- document type target assignment.
- `POST /api/v1/documents/upload`.
- `GET /api/v1/documents/download/[id]`.
- document record list/detail/soft-delete/restore.

**Must include:**
- multipart/form-data rules.
- MIME/content validation.
- SHA-256 hashing.
- `IStorageProvider` boundary.
- owner/staff/admin access rules.
- `allowMultipleSnapshot` trigger note: app must not manually set it.

**Verification:**

```bash
git diff --check
npm run lint
npm run typecheck
```

### Task 5: Document Verification & Notification API contracts

**Objective:** Define workflow contracts for verification and notification state.

**Files:**
- Create: `context/technical/api/verification-notification.md`
- Modify: `context/technical/api/README.md`
- Modify: `context/progress/task-board.md`

**Contracts to document:**
- approve document.
- reject document.
- list verification history.
- list notifications.
- mark notification read.
- mark all notifications read.

**Must include:**
- Staff minimum role for approve/reject.
- reject note required.
- `VerificationHistory` creation requirement.
- employee notification requirement.
- audit log requirement.

**Verification:**

```bash
git diff --check
npm run lint
npm run typecheck
```

### Task 6: Document System API contracts

**Objective:** Define contracts for settings, security log, statistics, and cron expiry reminder.

**Files:**
- Create: `context/technical/api/system.md`
- Modify: `context/technical/api/README.md`
- Modify: `context/progress/task-board.md`

**Contracts to document:**
- system setting read/update.
- security log list/detail/filter.
- statistics dashboard reads.
- `GET /api/v1/cron/check-expiry`.

**Must include:**
- Admin-only security log access.
- statistics read-only constraint.
- `CRON_SECRET` validation.
- reminder H-30/H-7/H-1 idempotency.

**Verification:**

```bash
git diff --check
npm run lint
npm run typecheck
```

### Task 7: Review contracts and split implementation issues

**Objective:** Ensure API contracts are ready before implementation and split implementation into small issues.

**Files:**
- Modify: `context/technical/api/README.md`
- Modify: `context/progress/task-board.md`
- Optional Create: GitHub issues for `SIMDP-API-001` through `SIMDP-API-006`.

**Review checklist:**
- Every external input has planned Zod validation.
- Every sensitive action has an audit event.
- Employee ownership rule is explicit.
- Server Actions / Route Handlers call service boundaries only.
- No client fetch direct pattern is introduced.
- Prisma limitations and database triggers are documented where relevant.

**Verification:**

```bash
git diff --check
npm run lint
npm run typecheck
```

---

## Implementation Gate

Do not implement API code until:

- `SIMDP-API-DOCS-001` through `SIMDP-API-DOCS-007` are Done.
- API docs are reviewed by mes/Sil.
- Implementation issues are created or confirmed.
- A feature branch exists per small implementation task.

---

## Risks and Open Questions

1. Need decision whether read APIs should be REST Route Handlers or Server Actions for dashboard-only reads.
2. Need standard response envelope before all detailed docs to avoid inconsistent contracts.
3. Need decide pagination/filter conventions before Employee/Document list endpoints.
4. Need decide exact file download strategy for local storage vs Supabase/S3 temporary URLs.
5. Need confirm whether implementation will include automated API tests now or only after route foundation.

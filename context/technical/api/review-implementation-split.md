# Review & Implementation Issue Breakdown — SIMDP API Contracts

**ID Dokumentasi:** SIMDP-API-DOCS-007  
**Tanggal Review:** 2026-07-09  
**Reviewer:** Antigravity (Developer Agent), verified by Hermes / mes  
**Status Kontrak Keseluruhan:** READY WITH NOTES (siap dijadikan backlog implementasi)

---

## 1. Executive Summary

Dokumentasi kontrak API v1 untuk SIMDP telah ditinjau terhadap aturan keamanan, RBAC, audit log, validasi Zod, module boundary, Prisma schema, domain rules, dan kebutuhan frontend.

Hasil review: seluruh kontrak sudah cukup lengkap untuk menjadi dasar implementasi. Dua area diberi status **Ready with notes** karena implementer perlu memperhatikan detail khusus:

1. `employee-master-data.md`: career history harus mendukung `employeeGroupId`; response profil perlu mencakup field profil opsional seperti `religion` dan `maritalStatus`.
2. `documents.md`: `DocumentRecord.fileSize` bertipe `BigInt` di Prisma, sehingga response JSON harus melakukan serialisasi aman sebelum dikirim ke frontend.

Tidak ada blocker yang mengharuskan kontrak API ditulis ulang sebelum implementasi. Implementasi tetap harus dimulai dari API foundation dan berjalan issue-by-issue.

---

## 2. Review Matrix per Contract File

| File Kontrak | Scope | Verdict | Catatan Utama |
|---|---|---|---|
| `conventions.md` | Standard envelope, pagination, error, auth cookie, audit, frontend API wrapper | **READY FOR IMPLEMENTATION** | Standar cukup lengkap untuk menjadi foundation helper API. |
| `auth.md` | Login, refresh, logout, reset password, change password, revoke session | **READY FOR IMPLEMENTATION** | Cookie httpOnly, single-device login, token rotation, dan audit sudah jelas. |
| `employee-master-data.md` | Profile, employee CRUD, career history, CSV import, master data HR | **READY WITH NOTES** | Implementer wajib memastikan `employeeGroupId`, `religion`, dan `maritalStatus` tidak hilang dari DTO/Zod schema. |
| `documents.md` | Document type, target rules, upload, preview/download, soft delete, restore | **READY WITH NOTES** | Implementer wajib men-serialize `BigInt` seperti `fileSize` secara aman. |
| `verification-notification.md` | Verification queue, approve/reject, history, notification | **READY FOR IMPLEMENTATION** | Reject note, history, notification, audit, dan ownership sudah eksplisit. |
| `system.md` | Settings, security log, statistics, cron expiry | **READY FOR IMPLEMENTATION** | Statistics read-only dan cron idempotency sudah jelas. |

---

## 3. Cross-cutting Findings

### 3.1 RBAC & Ownership

- Semua kontrak mencantumkan minimum role.
- Employee ownership rule eksplisit untuk profil, dokumen, notification, dan verification history.
- Security log hanya untuk Admin.
- Cron endpoint memakai `CRON_SECRET`, bukan user session biasa.

### 3.2 Audit Log

Aksi sensitif telah direncanakan untuk mencatat audit log, termasuk:

- login sukses/gagal;
- force logout / session revoke;
- password reset/change;
- employee CRUD/import;
- master data mutation;
- document upload/download/lifecycle;
- approve/reject verification;
- settings update;
- cron expiry run.

### 3.3 Zod Validation

Semua input eksternal direncanakan memakai Zod:

- JSON body auth/action;
- query/filter/pagination;
- route params;
- multipart/form-data metadata;
- CSV import metadata;
- cron secret/header/query.

### 3.4 Module Boundaries

Kontrak sudah mengikuti aturan:

```txt
Route Handler / Server Action -> service.ts -> repository.ts modul sendiri
```

Catatan implementasi: jika service butuh data modul lain, gunakan public `service.ts` modul target. Jangan import repository modul lain.

### 3.5 Frontend Contract Readiness

Kontrak sudah cukup untuk frontend karena mencakup:

- request shape;
- success/error envelope;
- pagination/filter convention;
- loading/empty/error state notes;
- cache invalidation notes;
- upload `FormData` convention;
- auth cookie behavior tanpa token di client JavaScript.

---

## 4. Risks & Open Questions

1. **Local storage provider path:** saat development, pastikan folder upload lokal berada di path yang aman dan sudah di-ignore oleh `.gitignore`.
2. **Cron local testing:** butuh seed/ad-hoc verification untuk simulasi H-30/H-7/H-1 tanpa menunggu jadwal real.
3. **Automated API tests:** project belum punya test runner khusus API. Jika test framework belum dipasang, implementer minimal wajib menjalankan lint/typecheck/build dan verifikasi manual/ad-hoc yang dijelaskan di issue.

---

## 5. Implementation Issue Breakdown

Implementasi dipecah menjadi 12 issue kecil agar sesuai workflow company-style dan mudah direview.

### SIMDP-API-001: API Foundation

**GitHub Issue:** [#15](https://github.com/tumbalku/simdp-bmas/issues/15)

**Scope:** response helper standar, error helper, Zod validation error mapping, auth/session helper foundation, role guard, route handler conventions.

**Acceptance Criteria:**

- [ ] Success responses follow `context/technical/api/conventions.md` envelope.
- [ ] Error responses follow standard error envelope and codes.
- [ ] Zod validation errors return field-level details.
- [ ] Role helper rejects insufficient roles with `FORBIDDEN`.
- [ ] No Client Component imports server-only env/prisma helpers.

**Likely Files:**

- `src/lib/api-response.ts`
- `src/lib/auth-helpers.ts`
- `src/middleware.ts`

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** API docs contracts through `SIMDP-API-DOCS-007`.

### SIMDP-API-002: Auth API

**GitHub Issue:** [#16](https://github.com/tumbalku/simdp-bmas/issues/16)

**Scope:** login, refresh, logout, forgot password, reset password, change password, revoke session, revoke all sessions.

**Acceptance Criteria:**

- [ ] Login supports NIK 16 digit, NIP >= 10 digit, and email identifier detection.
- [ ] Login sets httpOnly access/refresh cookies and records audit events.
- [ ] Single-device login revokes previous active refresh tokens.
- [ ] Refresh rotation revokes old token and stores only token hash.
- [ ] Forgot password response is generic and does not leak account existence.
- [ ] Reset password token is one-time use and expires after 1 hour.
- [ ] Change password validates old password first.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** SIMDP-API-001.

### SIMDP-API-003a: Employee Profile & Career History API

**GitHub Issue:** [#17](https://github.com/tumbalku/simdp-bmas/issues/17)

**Scope:** current profile read, employee self profile update, admin career history add.

**Acceptance Criteria:**

- [ ] Current profile returns Employee fields and related master data, including `religion` and `maritalStatus`.
- [ ] Employee self update is limited to allowed non-critical fields.
- [ ] Admin career history action supports `employeeGroupId` and current assignment synchronization.
- [ ] Employee ownership is enforced server-side.
- [ ] Sensitive changes create audit logs.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** SIMDP-API-002.

### SIMDP-API-003b: Admin Employee CRUD & CSV Import API

**GitHub Issue:** [#18](https://github.com/tumbalku/simdp-bmas/issues/18)

**Scope:** admin employee create/update/soft-delete/restore and CSV import.

**Acceptance Criteria:**

- [ ] Admin-only guard enforced.
- [ ] Create/update validates at least one of NIP (`employeeId`) or NIK.
- [ ] Soft delete sets `deletedAt` on related Employee/User records as contracted.
- [ ] Restore clears `deletedAt` according to retention rules.
- [ ] CSV import validates structure and returns success/failure summary per row.
- [ ] Audit logs are created for sensitive admin actions.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** SIMDP-API-003a.

### SIMDP-API-003c: Master Data HR Administration API

**GitHub Issue:** [#19](https://github.com/tumbalku/simdp-bmas/issues/19)

**Scope:** EmploymentStatus, EmployeeGroup, ProfessionGroup, EmployeePosition, EmployeeRank, Workplace read/admin mutation.

**Acceptance Criteria:**

- [ ] STAFF+ can read master data where needed by UI.
- [ ] ADMIN can create/update/delete master data.
- [ ] Delete rejects when records are still referenced.
- [ ] Unique constraints are handled with safe `CONFLICT` errors.
- [ ] Audit logs are created for admin mutations.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** SIMDP-API-001.

### SIMDP-API-004a: Document Type Administration API

**GitHub Issue:** [#20](https://github.com/tumbalku/simdp-bmas/issues/20)

**Scope:** document type CRUD and target relation management.

**Acceptance Criteria:**

- [ ] Admin can manage document type fields and soft delete/restore where applicable.
- [ ] Target relations support profession, employment status, employee group, rank, and workplace.
- [ ] Matching follows BR-005: OR within category, AND across categories, empty category means all.
- [ ] Audit logs are created for document type changes.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** SIMDP-API-001.

### SIMDP-API-004b: Document Records & Upload API

**GitHub Issue:** [#21](https://github.com/tumbalku/simdp-bmas/issues/21)

**Scope:** `POST /api/v1/documents/upload`, file validation, hash calculation, storage upload, `DocumentRecord` creation.

**Acceptance Criteria:**

- [ ] Upload uses `multipart/form-data` and validates metadata with Zod.
- [ ] Conditional fields follow DocumentType requirements.
- [ ] Server validates file size and MIME/content, not only extension.
- [ ] Server computes SHA-256 file hash.
- [ ] Upload goes through `IStorageProvider` only.
- [ ] App does not manually set `allowMultipleSnapshot`; DB trigger handles it.
- [ ] `fileSize` BigInt is serialized safely for frontend responses.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
npm run prisma:validate
```

**Depends On:** SIMDP-API-004a, SIMDP-API-002.

### SIMDP-API-004c: Document Download & Lifecycle API

**GitHub Issue:** [#22](https://github.com/tumbalku/simdp-bmas/issues/22)

**Scope:** secure preview/download and document lifecycle actions.

**Acceptance Criteria:**

- [ ] Download/preview returns temporary URL or controlled internal access only.
- [ ] Employee can access only own documents; STAFF/ADMIN can access all according to RBAC.
- [ ] Soft delete sets `deletedAt` and handles current-document state safely.
- [ ] Employee soft delete is limited to allowed statuses.
- [ ] Admin restore follows retention policy.
- [ ] Audit logs are created for download/lifecycle sensitive actions as contracted.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** SIMDP-API-004b.

### SIMDP-API-005a: Document Verification Workflow API

**GitHub Issue:** [#23](https://github.com/tumbalku/simdp-bmas/issues/23)

**Scope:** verification queue, approve/reject action, verification history reads.

**Acceptance Criteria:**

- [ ] STAFF+ can see pending verification queue.
- [ ] Approve/reject updates `DocumentRecord.status` and creates `VerificationHistory`.
- [ ] Reject requires review note with minimum length from contract.
- [ ] Verification decision sends notification to document owner.
- [ ] Verification actions create audit logs.
- [ ] Employee history reads enforce ownership.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** SIMDP-API-004b.

### SIMDP-API-005b: In-App Notifications API

**GitHub Issue:** [#24](https://github.com/tumbalku/simdp-bmas/issues/24)

**Scope:** notification list, unread count, mark one/all as read.

**Acceptance Criteria:**

- [ ] User can access only own notifications.
- [ ] Unread count is efficient and accurate.
- [ ] Mark-read actions update `isRead` only for current user notifications.
- [ ] Frontend cache invalidation notes are followed.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** SIMDP-API-001.

### SIMDP-API-006a: System Settings & Security Audit Log API

**GitHub Issue:** [#25](https://github.com/tumbalku/simdp-bmas/issues/25)

**Scope:** system settings and admin security/audit log reads.

**Acceptance Criteria:**

- [ ] ADMIN-only guard enforced for settings and security log.
- [ ] Settings updates validate allowed keys and values with Zod.
- [ ] Settings changes create `SYSTEM_SETTING_UPDATED` audit log.
- [ ] SecurityLog is read-only/append-only; no update/delete endpoint exists.
- [ ] Security log list supports pagination/filter from contract.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
```

**Depends On:** SIMDP-API-001.

### SIMDP-API-006b: Dashboard Statistics & Expiry Cron API

**GitHub Issue:** [#26](https://github.com/tumbalku/simdp-bmas/issues/26)

**Scope:** read-only dashboard statistics and protected expiry cron.

**Acceptance Criteria:**

- [ ] Statistics module is read-only and never writes data.
- [ ] Dashboard stats include compliance/document summaries as contracted.
- [ ] Cron endpoint validates `CRON_SECRET` through env helper/config.
- [ ] Cron marks expired approved documents as `EXPIRED`.
- [ ] Reminder H-30/H-7/H-1 is idempotent using `reminderHXXSentAt` fields.
- [ ] Cron behavior is verifiable locally with seeded/ad-hoc data.

**Verification:**

```bash
npm run lint
npm run typecheck
npm run build
npm run prisma:validate
```

**Depends On:** SIMDP-API-004b, SIMDP-API-005b.

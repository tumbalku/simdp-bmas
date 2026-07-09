# Task Board — SIMDP

## Backlog

### API Implementation Queue

- [ ] [#15](https://github.com/tumbalku/simdp-bmas/issues/15) SIMDP-API-001: Implementasi API foundation (shared response helpers, error handling, auth guard, role guard, dan route handler conventions).
- [ ] [#16](https://github.com/tumbalku/simdp-bmas/issues/16) SIMDP-API-002: Implementasi Auth API (login, refresh, logout, password reset, change password, session list/revoke).
- [ ] [#17](https://github.com/tumbalku/simdp-bmas/issues/17) SIMDP-API-003a: Implementasi Employee Profile & Career History API (getCurrentProfile, updateProfileAction, addCareerHistoryAction).
- [ ] [#18](https://github.com/tumbalku/simdp-bmas/issues/18) SIMDP-API-003b: Implementasi Admin Employee CRUD & CSV Import API (crudEmployeeAction, importEmployeesAction).
- [ ] [#19](https://github.com/tumbalku/simdp-bmas/issues/19) SIMDP-API-003c: Implementasi Master Data HR Administration API (crudMasterDataAction).
- [ ] [#20](https://github.com/tumbalku/simdp-bmas/issues/20) SIMDP-API-004a: Implementasi Document Type Administration API (crudDocumentTypeAction).
- [ ] [#21](https://github.com/tumbalku/simdp-bmas/issues/21) SIMDP-API-004b: Implementasi Document Records & Upload API (POST /api/v1/documents/upload dengan storage provider dan database triggers).
- [ ] [#22](https://github.com/tumbalku/simdp-bmas/issues/22) SIMDP-API-004c: Implementasi Document Download & Lifecycle API (GET /api/v1/documents/download/[id], softDeleteDocumentAction, restoreDocumentAction).
- [ ] [#23](https://github.com/tumbalku/simdp-bmas/issues/23) SIMDP-API-005a: Implementasi Document Verification Workflow API (getVerificationQueue, verifyDocumentAction, getVerificationHistory).
- [ ] [#24](https://github.com/tumbalku/simdp-bmas/issues/24) SIMDP-API-005b: Implementasi In-App Notifications API (getNotifications, getUnreadNotificationCount, markNotificationReadAction, markAllNotificationsReadAction).
- [ ] [#25](https://github.com/tumbalku/simdp-bmas/issues/25) SIMDP-API-006a: Implementasi System Settings & Security Audit Log API (getSystemSettings, updateSystemSettingAction, getSecurityLog).
- [ ] [#26](https://github.com/tumbalku/simdp-bmas/issues/26) SIMDP-API-006b: Implementasi Dashboard Statistics & Expiry Cron API (getStatistics, GET /api/v1/cron/check-expiry).

## In Progress

Belum ada.

## Done

- [x] SIMDP-API-DOCS-007: Review semua kontrak API terhadap RBAC, audit log, Zod validation, module boundaries, dan Prisma schema; pecah hasilnya menjadi issue implementasi API kecil (selesai: 2026-07-09)
- [x] SIMDP-API-DOCS-002: Dokumentasikan kontrak API Auth (`login`, `refresh`, `logout`, `forgot-password`, `reset-password`, `change-password`, session revoke) sebelum implementasi (selesai: 2026-07-09)
- [x] SIMDP-API-DOCS-003: Dokumentasikan kontrak API Employee & Master Data (profile, employee CRUD, career history, employment status, group, profession, position, rank, workplace) sebelum implementasi (selesai: 2026-07-09)
- [x] SIMDP-API-DOCS-004: Dokumentasikan kontrak API Document Type & Document Record (document type CRUD, target rules, upload, download/preview, soft delete/restore) sebelum implementasi (selesai: 2026-07-09)
- [x] SIMDP-API-DOCS-005: Dokumentasikan kontrak API Verification & Notification (approve/reject, verification history, notification read state) sebelum implementasi (selesai: 2026-07-09)
- [x] SIMDP-API-DOCS-006: Dokumentasikan kontrak API Settings, Security Log, Statistics, dan Cron expiry reminder sebelum implementasi (selesai: 2026-07-09)
- [x] SIMDP-API-DOCS-001: Tetapkan standar dokumentasi API v1 (format kontrak endpoint, response envelope, error shape, auth/role notation, audit notes, contoh request/response, pagination/filter, upload, dan frontend API wrapper conventions) (selesai: 2026-07-09)
- [x] SIMDP-DB-003: create initial Prisma migration baseline under prisma/migrations using the SQL from dms_pegawai_schema.sql (selesai: 2026-07-09)
- [x] SIMDP-OPS-001: Dokumentasikan workflow mes + Antigravity orchestration (selesai: 2026-07-09)

- [x] SIMDP-DB-002: Setup Prisma Client singleton dan env validation (selesai: 2026-07-08)
- [x] SIMDP-DB-001: Sinkronkan Prisma schema dengan `dms_pegawai_schema.sql` (selesai: 2026-07-08)
- [x] SIMDP-SETUP-002: Setup Tremor Charts untuk dashboard statistics (selesai: 2026-07-08)
- [x] SIMDP-SETUP-001: Scaffold Next.js 15 + TypeScript + Tailwind + shadcn/ui (selesai: 2026-07-08)
- [x] SIMDP-CTX-001: Setup folder context tahap pertama (`ui`, `memory`, `progress`) (selesai: 2026-07-08)
- [x] SIMDP-CTX-002: Setup `context/business` sesuai PRD §23.1 (selesai: 2026-07-08)
- [x] SIMDP-CTX-003: Setup `context/domain` sesuai PRD §23.2 (selesai: 2026-07-08)
- [x] SIMDP-CTX-004: Setup `context/architecture` dan ADR awal sesuai PRD §23.3 (selesai: 2026-07-08)
- [x] SIMDP-CTX-005: Setup `context/technical` sesuai PRD §23.4 (selesai: 2026-07-08)
- [x] SIMDP-CTX-006: Setup `context/coding-standards` sesuai PRD §23.5 (selesai: 2026-07-08)
- [x] SIMDP-CTX-007: Setup `context/security` sesuai PRD §23.6 (selesai: 2026-07-08)

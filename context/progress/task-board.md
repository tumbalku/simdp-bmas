# Task Board — SIMDP

## Backlog

### UI Implementation Queue

- [ ] [#48](https://github.com/tumbalku/simdp-bmas/issues/48) SIMDP-UI-004: Scaffold public auth route templates
- [ ] [#49](https://github.com/tumbalku/simdp-bmas/issues/49) SIMDP-UI-005: Fase 1 implement Auth UI and dashboard shell
- [ ] [#50](https://github.com/tumbalku/simdp-bmas/issues/50) SIMDP-UI-006: Fase 2 implement dashboard feature UI pages

### Test Coverage & TDD Roadmap

(Semua rencana kerja test coverage selesai)

### API Implementation Queue

(Semua antrean implementasi v1 selesai)

## In Progress

Belum ada.

## Done

- [x] [#42](https://github.com/tumbalku/simdp-bmas/issues/42) SIMDP-UI-001: Install Taste Skill for Antigravity UI work (selesai: 2026-07-09)

- [x] [#40](https://github.com/tumbalku/simdp-bmas/issues/40) SIMDP-UI-000: Prepare shadcn component library and local preview sandbox (selesai: 2026-07-09)

- [x] [#31](https://github.com/tumbalku/simdp-bmas/issues/31) SIMDP-TEST-001: Setup Vitest unit test infrastructure (selesai: 2026-07-09)
- [x] [#32](https://github.com/tumbalku/simdp-bmas/issues/32) SIMDP-TEST-002: Unit tests for lib helpers (selesai: 2026-07-09)
- [x] [#33](https://github.com/tumbalku/simdp-bmas/issues/33) SIMDP-TEST-003: Unit tests for auth module (selesai: 2026-07-09)
- [x] [#34](https://github.com/tumbalku/simdp-bmas/issues/34) SIMDP-TEST-004: Unit tests for document module (selesai: 2026-07-09)
- [x] [#35](https://github.com/tumbalku/simdp-bmas/issues/35) SIMDP-TEST-005: Unit tests for employee, verification, notification, settings, security, statistics modules (selesai: 2026-07-09)
- [x] [#36](https://github.com/tumbalku/simdp-bmas/issues/36) SIMDP-TEST-006: API route and integration test baseline (selesai: 2026-07-09)
- [x] [#38](https://github.com/tumbalku/simdp-bmas/issues/38) SIMDP-TEST-007: Address API route and test suite review gaps (selesai: 2026-07-09)

- [x] [#29](https://github.com/tumbalku/simdp-bmas/issues/29) SIMDP-API-SEC-001: Perbaiki critical API security findings dari review sementara tanpa mengubah pola `z.email("Format email tidak valid")` (selesai: 2026-07-09)
- [x] [#15](https://github.com/tumbalku/simdp-bmas/issues/15) SIMDP-API-001: Implementasi API foundation (selesai: 2026-07-09)
- [x] [#16](https://github.com/tumbalku/simdp-bmas/issues/16) SIMDP-API-002: Implementasi Auth API (selesai: 2026-07-09)
- [x] [#17](https://github.com/tumbalku/simdp-bmas/issues/17) SIMDP-API-003a: Implementasi Employee Profile & Career History API (selesai: 2026-07-09)
- [x] [#18](https://github.com/tumbalku/simdp-bmas/issues/18) SIMDP-API-003b: Implementasi Admin Employee CRUD & CSV Import API (selesai: 2026-07-09)
- [x] [#19](https://github.com/tumbalku/simdp-bmas/issues/19) SIMDP-API-003c: Implementasi Master Data HR Administration API (selesai: 2026-07-09)
- [x] [#20](https://github.com/tumbalku/simdp-bmas/issues/20) SIMDP-API-004a: Implementasi Document Type Administration API (selesai: 2026-07-09)
- [x] [#21](https://github.com/tumbalku/simdp-bmas/issues/21) SIMDP-API-004b: Implementasi Document Records & Upload API (selesai: 2026-07-09)
- [x] [#22](https://github.com/tumbalku/simdp-bmas/issues/22) SIMDP-API-004c: Implementasi Document Download & Lifecycle API (selesai: 2026-07-09)
- [x] [#23](https://github.com/tumbalku/simdp-bmas/issues/23) SIMDP-API-005a: Implementasi Document Verification Workflow API (selesai: 2026-07-09)
- [x] [#24](https://github.com/tumbalku/simdp-bmas/issues/24) SIMDP-API-005b: Implementasi In-App Notifications API (selesai: 2026-07-09)
- [x] [#25](https://github.com/tumbalku/simdp-bmas/issues/25) SIMDP-API-006a: Implementasi System Settings & Security Audit Log API (selesai: 2026-07-09)
- [x] [#26](https://github.com/tumbalku/simdp-bmas/issues/26) SIMDP-API-006b: Implementasi Dashboard Statistics & Expiry Cron API (selesai: 2026-07-09)


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

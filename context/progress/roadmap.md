# Roadmap — SIMDP

**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §19
**Terakhir diperbarui:** 2026-07-08

## Status Legend

- `Not Started`: belum dikerjakan.
- `In Progress`: sedang dikerjakan.
- `Done`: sudah selesai dan tervalidasi.
- `Blocked`: tertahan oleh dependency/keputusan.

## Fase Pengembangan

| Fase | Fokus | Output | Status |
|---|---|---|---|
| Fase 0 — Setup | Init Next.js, Prisma schema sinkron SQL, setup Supabase, auth dasar | Login/logout jalan, skema ter-migrate | In Progress |
| Fase 1 — Core Employee & Document | Modul `employee`, modul `document`, upload, lihat dokumen, DocumentType | Employee bisa upload & lihat dokumen sendiri | Not Started |
| Fase 2 — Verification & Notification | Modul `verification`, modul `notification`, in-app notification, cron expiry | Staff bisa approve/reject, Employee dapat notifikasi | Not Started |
| Fase 3 — Admin & Master Data | CRUD Employee lengkap, import/export CSV, riwayat karier, User management, soft delete & restore | Admin penuh kelola sistem | Not Started |
| Fase 4 — Statistik & Dashboard | Modul `statistics`, charting Tremor, layout/wrapper shadcn/ui | Dashboard admin/staff lengkap | Not Started |
| Fase 5 — Security & Hardening | Security log UI, rate limiting, session management UI, audit trail lengkap | Sistem siap produksi | Not Started |
| Fase 6 — Polish UI/UX | Tema shadcn/ui Clinical Dashboard, responsive, aksesibilitas, empty states | UI konsisten §17 | Not Started |

## Fokus Saat Ini

Fase 0 — setup fondasi proyek dan context folder.

Prioritas dekat:
1. Selesaikan semua folder `context/` sesuai PRD §23.
2. Scaffold Next.js 15 + TypeScript + Tailwind + shadcn/ui.
3. Sinkronkan Prisma schema dengan `dms_pegawai_schema.sql`.
4. Setup validasi dasar: lint, typecheck, test.

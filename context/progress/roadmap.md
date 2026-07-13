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
| Fase 0 — Setup | Init Next.js, Prisma schema sinkron SQL, setup Supabase, auth dasar | Login/logout jalan, skema ter-migrate | Done (`#59`) |
| Fase 1 — Core Employee & Document | Modul `employee`, modul `document`, upload, lihat dokumen, DocumentType | Employee bisa upload & lihat dokumen sendiri | In Progress (`#60`) |
| Fase 2 — Verification & Notification | Modul `verification`, modul `notification`, in-app notification, cron expiry | Staff bisa approve/reject, Employee dapat notifikasi | Not Started (`#61`) |
| Fase 3 — Admin & Master Data | CRUD Employee lengkap, import/export CSV, riwayat karier, User management, soft delete & restore | Admin penuh kelola sistem | Not Started (`#62`) |
| Fase 4 — Statistik & Dashboard | Modul `statistics`, charting Tremor, layout/wrapper shadcn/ui | Dashboard admin/staff lengkap | Not Started (`#63`) |
| Fase 5 — Security & Hardening | Security log UI, rate limiting, session management UI, audit trail lengkap | Sistem siap produksi | Not Started (`#64`) |
| Fase 6 — Polish UI/UX | Tema shadcn/ui Clinical Dashboard, responsive, aksesibilitas, empty states | UI konsisten §17 | Not Started (`#65`) |

## Fokus Saat Ini

Fase 1 — core employee & document.

Prioritas dekat:
1. Mulai issue #60 (Core Employee & Document).
2. Review kebutuhan upload dan preview dokumen.
3. Sinkronkan data master document type dan target rules.
4. Pastikan context/progress dan changelog tetap terbarui.

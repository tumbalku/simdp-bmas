# `prisma/migrations-archive` — Migrasi Schema v1 (TIDAK AKTIF)

> **Status: ARSIP — jangan dipakai oleh tooling atau developer.**

Folder ini berisi **20 migration schema v1** yang sudah **tidak terpakai** sejak branch `codex/align-v2-code` mengarahkan `prisma.config.ts` ke `prisma/migrations-v2` (schema v2.3).

## Kenapa dipindahkan?

1. **Mencegah baseline ganda.** `prisma migrate diff`, `prisma migrate dev`, dan CI yang memakai path default (`prisma/migrations`) akan mengambil baseline v1 dan menghasilkan drift terhadap `schema.prisma` v2.3.
2. **Mencegah kesalahan aplikasi.** Migration pertama `migrations-v2/20260920024915_init_v2` adalah `CREATE TABLE` penuh untuk database **baru**. Database v1 yang sudah ada data **tidak boleh** menjalankan rantai itu — gunakan `migrations-v2/20260922000000_migrate_v1_to_v2` (lihat bawah).
3. **Menjaga history.** Dipindahkan, bukan dihapus, supaya sejarah schema v1 tetap bisa ditelusuri dan migration transisi bisa di-review berdampingan.

## Cara migrasi database existing (v1 → v2.3)

Database **baru** (fresh install): jalankan `prisma migrate deploy` biasa — `prisma.config.ts` sudah mengarah ke `prisma/migrations-v2`.

Database **v1 yang sudah ada data**: ikuti runbook
`context/technical/migration-v1-to-v2.md` (preflight → backup → apply
`20260922000000_migrate_v1_to_v2` → apply trigger hardening → verify →
rollback). **Eksekusi di production adalah tindakan high-risk**
(`AGENTS.md` §10) — wajib persetujuan eksplisit user + jendela maintenance.

## Isi folder

| # | Migration | Catatan |
|---|---|---|
| 1 | `20260709000000_init` | Baseline v1 |
| 2 | `20260715000000_add_document_type_employee_position` | |
| 3 | `20260716031827_add_employee_status_column` | |
| 4 | `20260718071000_migrate_employee_profile_enums` | |
| 5 | `20260718073000_migrate_remaining_canonical_enums` | |
| 6 | `20260718080500_migrate_security_log_actor_status_enums` | |
| 7 | `20260722090000_add_document_verification` | |
| 8 | `20260723100000_add_user_two_factor` | |
| 9 | `20260723103000_add_email_otp_columns_to_user_two_factor` | |
| 10 | `20260723171000_add_employee_google_avatar_url` | |
| 11 | `20260724090000_add_rate_limit_bucket` | |
| 12 | `20260729062000_add_employee_directory_verification` | |
| 13 | `20260801054000_add_employee_documents_verification` | |
| 14 | `20260812000000_add_master_data_documents_verification` | |
| 15 | `20260829000000_rename_employee_rank_pangkat_golongan` | |
| 16 | `20260908090000_add_user_registration_requests` | |
| 17 | `20260910073000_harden_user_registration_requests` | |
| 18 | `20260910074500_align_rate_limit_bucket_updated_at` | |
| 19 | `20260910110000_add_profile_self_update_cooldown` | |

`migration_lock.toml` (provider = postgresql) sengaja dipertahankan agar
folder tetap dikenali sebagai direktori migrasi Prisma bila suatu saat
perlu dibaca sebagai baseline historis.

## Referensi

- `prisma.config.ts` — konfigurasi migrasi aktif (`prisma/migrations-v2`).
- `prisma/migrations-v2/20260922000000_migrate_v1_to_v2/migration.sql` — migration transisi v1 → v2.3 (issue #317).
- `context/technical/migration-v1-to-v2.md` — runbook lengkap (preflight, backup, apply, verify, rollback).
- `REVIEW.md` §3 B-1 dan §5 M-6 — alasan penyarikanan folder ini.
- `context/memory/decisions-log.md` [2026-09-21] Strategi Migrasi v1 → v2.

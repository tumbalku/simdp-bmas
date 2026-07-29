---
title: Architecture Decisions
---

# Architecture Decisions

Keputusan arsitektur lengkap disimpan di `context/memory/decisions-log.md` dan `context/architecture/adr/`. Halaman ini merangkum keputusan yang paling penting untuk memahami SIMDP.

## Keputusan inti

| Topik | Keputusan |
|---|---|
| Framework | Next.js App Router. |
| Database | PostgreSQL dengan Prisma 7. SQL baseline tetap menjaga trigger/constraint PostgreSQL. |
| Auth | Custom JWT + refresh token httpOnly cookie, bukan NextAuth/Supabase Auth. |
| Session | Single-device login. Login baru revoke sesi lama. |
| Identifier login | Email, NIP, atau NIK dalam satu field. |
| Storage | Provider-agnostic via `IStorageProvider`: local, Supabase, S3-ready. |
| API | REST API v1 dan Server Actions, bukan GraphQL untuk v1. |
| Statistics | Modul read-only. |
| Event side effect | Internal event bus untuk notification/email/realtime. |
| Backup | `STORAGE_PROVIDER` dipisah dari `BACKUP_TARGET`. |

## Keputusan terbaru yang berdampak operasional

### Backup production

Target utama backup production adalah Google Drive service account. VPS/local menjadi jalur kedua, S3 menjadi opsi terakhir/future.

### Backup source storage

Helper VPS/local membaca source storage dari `STORAGE_PROVIDER`. Nilai `local` membaca folder lokal, sedangkan `supabase` menarik object dari Supabase Storage.

### Rate limiting multi-instance

Rate limiting memakai tabel PostgreSQL `RateLimitBucket` sebagai shared store awal. Ini cukup untuk production awal dan tidak bergantung pada memory per process.

### Middleware auth coverage

Middleware melindungi semua top-level route dashboard seperti `/documents`, `/master-data`, `/profile`, `/settings`, `/verification`, `/statistics`, dan lainnya.

## Cara menambah keputusan baru

1. Tulis perubahan behavior atau arsitektur di PR.
2. Tambahkan entry baru di `context/memory/decisions-log.md`.
3. Jika keputusan besar, tambahkan ADR baru di `context/architecture/adr/`.
4. Update halaman Docusaurus yang relevan.

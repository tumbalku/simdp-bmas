# Technical Stack — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §4
**Terakhir diperbarui:** 2026-07-08

## Stack Utama

| Layer | Teknologi | Catatan Implementasi |
|---|---|---|
| Framework | Next.js 15.5.x App Router + TypeScript | Satu aplikasi untuk frontend dan backend. Gunakan Server Components bila memungkinkan. |
| Styling/UI | Tailwind CSS v4 + shadcn/ui | shadcn/ui adalah canonical design system untuk komponen umum. |
| Charting | Tremor Charts (`@tremor/react`) | Khusus chart/statistik, dibungkus layout shadcn/ui. |
| Client Data Fetching | TanStack Query | Semua client query lewat `hooks.ts`, bukan `fetch` langsung di komponen. |
| Database | PostgreSQL hosted di Supabase | SQL schema awal ada di `dms_pegawai_schema.sql`. |
| ORM | Prisma | Prisma schema harus sinkron dengan SQL. |
| File Storage | Pluggable Storage Provider | `local`, `supabase`, atau `s3` via `IStorageProvider`. |
| Auth | Custom JWT + Refresh Token | Access token 15 menit, refresh token hash di DB. |
| Validation | Zod | Semua input dari luar wajib divalidasi. |
| Password Hashing | Argon2id | Jangan gunakan plaintext/bcrypt baru kecuali ada keputusan baru. |
| Scheduled Job | Vercel Cron Jobs | Memanggil `/api/v1/cron/check-expiry` dengan `CRON_SECRET`. |
| Email | Resend atau Supabase SMTP | Reset password dan reminder dokumen. |
| Testing | Vitest + Playwright | Unit test untuk business logic, E2E untuk flow penting. |

## Prinsip Stack

- Jangan menambah library besar tanpa keputusan baru di `context/memory/decisions-log.md`.
- Jangan mengganti stack canonical tanpa update PRD dan context terkait.
- Jika dependency baru ditambahkan, update file ini, `package.json`, dan changelog.

## Status Scaffold

Project Next.js sudah discaffold pada `SIMDP-SETUP-001` dengan script awal:

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Script `npm test` belum tersedia dan akan ditambahkan saat setup testing dimulai. Tremor Charts belum dipasang; lihat backlog `SIMDP-SETUP-002`.

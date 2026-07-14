# Environment Variables — SIMDP

**Status:** Draft awal
**Sumber utama:** `PRD-SIMDP-v2.0-20260708.md` §18.1
**Terakhir diperbarui:** 2026-07-08

Semua environment variable wajib divalidasi saat startup dengan Zod di `src/lib/env.ts`. Modul server-side harus mengimpor `env` dari file ini, bukan membaca `process.env` langsung, kecuali file konfigurasi tooling seperti `prisma.config.ts`.

## Database

| Variable | Required | Keterangan |
|---|:---:|---|
| `DATABASE_URL` | Yes | Supabase pooled connection string untuk runtime dan Prisma 7 config (`prisma.config.ts`). |
| `DIRECT_URL` | Yes | Supabase direct connection untuk SQL migration/manual migration. Belum dipakai langsung oleh Prisma config pada baseline ini. |

## Storage

| Variable | Required | Keterangan |
|---|:---:|---|
| `STORAGE_PROVIDER` | Yes | `local`, `supabase`, atau `s3`. Development default: `local`. |
| `SUPABASE_URL` | Jika supabase | URL project Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Jika supabase | Service role key server-side only. Jangan expose ke client. |
| `SUPABASE_STORAGE_BUCKET` | Jika supabase | Default `employee-documents`. |
| `S3_ENDPOINT` | Optional | Untuk S3-compatible selain AWS. |
| `S3_REGION` | Jika s3 | Region bucket. |
| `S3_BUCKET` | Jika s3 | Nama bucket. |
| `S3_ACCESS_KEY_ID` | Jika s3 | Access key. Secret. |
| `S3_SECRET_ACCESS_KEY` | Jika s3 | Secret key. Secret. |

## Auth & Security

| Variable | Required | Keterangan |
|---|:---:|---|
| `JWT_SECRET` | Yes | Secret signing access token JWT. |
| `REFRESH_TOKEN_SECRET` | Yes | Secret untuk hashing/derivasi refresh token. |
| `CRON_SECRET` | Yes | Secret untuk endpoint cron internal. |

## Email & App URL

| Variable | Required | Keterangan |
|---|:---:|---|
| `RESEND_API_KEY` | Jika Resend | API key email. |
| `EMAIL_FROM` | Jika Resend | Email pengirim. Default: `onboarding@resend.dev`. |
| `NEXT_PUBLIC_APP_URL` | Yes | URL aplikasi untuk link email. Public, boleh prefix `NEXT_PUBLIC_`. |

## Realtime / Pusher

| Variable | Required | Keterangan |
|---|:---:|---|
| `PUSHER_APP_ID` | Jika Pusher | App ID Pusher server. |
| `PUSHER_KEY` | Jika Pusher | Key Pusher server. |
| `PUSHER_SECRET` | Jika Pusher | Secret Pusher server. |
| `PUSHER_CLUSTER` | Jika Pusher | Cluster Pusher server. |
| `NEXT_PUBLIC_PUSHER_KEY` | Jika Pusher | Key Pusher client. |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Jika Pusher | Cluster Pusher client. |

## Background Job / Inngest

| Variable | Required | Keterangan |
|---|:---:|---|
| `INNGEST_EVENT_KEY` | Jika Inngest | Event key untuk mengirim event ke Inngest Cloud. |
| `INNGEST_SIGNING_KEY` | Jika Inngest | Signing key untuk memverifikasi request dari Inngest. |

## Contoh Development

```env
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
STORAGE_PROVIDER="local"
JWT_SECRET="dev-change-me"
REFRESH_TOKEN_SECRET="dev-change-me-too"
CRON_SECRET="dev-cron-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Larangan

- Jangan commit `.env`, `.env.local`, `.env.production`.
- Jangan expose service role key ke client.
- Jangan prefix secret dengan `NEXT_PUBLIC_`.
- Jangan tulis secret asli di dokumentasi, issue, PR, log, atau `SecurityLog.metadata`.

## File Contoh

Gunakan `.env.example` untuk nama variable dan nilai development dummy. Jangan commit nilai secret asli.

## Pola Pemakaian

- Server-side code: `import { env } from "@/lib/env"`.
- Prisma runtime: `src/lib/prisma.ts` memakai `env.DATABASE_URL` dan Prisma PostgreSQL adapter.
- Client-side code hanya boleh membaca variable berawalan `NEXT_PUBLIC_`; jangan import `src/lib/env.ts` dari Client Component.
